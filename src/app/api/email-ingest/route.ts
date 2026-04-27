'use server';

import { NextResponse } from 'next/server';
import { processInboundEmail } from '@/app/actions/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { claimIdempotencyKey } from '@/lib/idempotency';

const INGEST_SECRET = process.env.EMAIL_INGEST_SECRET;

export async function POST(request: Request) {
  console.log('--- [API] /api/email-ingest endpoint HIT ---');

  // 1. Security Check
  if (INGEST_SECRET) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${INGEST_SECRET}`) {
      console.error('[API] ❌ Unauthorized: Authorization header does not match INGEST_SECRET.');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[API] ✅ Authorization successful.');
  } else {
    console.warn('[API] ⚠️ EMAIL_INGEST_SECRET is not set. The webhook is not secure.');
  }

  try {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(`email-ingest:${forwardedFor}`, 30, 60_000);
    if (!rateLimit.allowed) {
      console.error('[API] ❌ Rate limit exceeded for email ingest source.');
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const payload = await request.json();
    console.log('[API] ➡️ Received payload:', JSON.stringify(payload, null, 2));

    // 2. Extract Data
    const from = payload.from;
    const to = payload.to;
    const subject = payload.subject;
    
    // ✅ FIX: Primero buscar en payload.body (que es lo que envía el worker)
    const body = payload.body || payload.text || payload.html || 'No content';
    
    const messageId = payload.messageId || payload.headers?.['message-id'] || `no-id-${Date.now()}`;
    const inReplyTo = payload.inReplyTo || payload.headers?.['in-reply-to'];
    const references = payload.references || payload.headers?.['references'];

    const shouldProcess = await claimIdempotencyKey(`email-ingest:${messageId}`, 60 * 10);
    if (!shouldProcess) {
        console.log(`[API] ♻️ Duplicate email ingest ignored for messageId ${messageId}.`);
        return NextResponse.json({ success: true, message: 'Duplicate webhook ignored.' });
    }

    // 🔍 LOG: Verificar qué se extrajo
    console.log('[API] 📧 Extracted data:');
    console.log('[API]   from:', from);
    console.log('[API]   to:', to);
    console.log('[API]   subject:', subject);
    console.log('[API]   body:', body);
    console.log('[API]   body length:', body ? body.length : 0);
    console.log('[API]   messageId:', messageId);

    if (!from || !to || !subject) {
        console.error('[API] ❌ Missing required email fields (from, to, subject).');
        return NextResponse.json({ success: false, error: 'Missing required email fields (from, to, subject).' }, { status: 400 });
    }

    console.log(`[API] 🚀 Handing off to processInboundEmail for: ${to}`);
    
    // 3. Process Email
    const result = await processInboundEmail({ 
        from, 
        to, 
        subject, 
        body,
        messageId,
        inReplyTo,
        references
    });

    if ('error' in result) {
        console.error('[API] ❌ Failed to process email in action:', result.error);
        // Still respond 200 OK to Plunk/CF to prevent retries. The error is logged on our end.
        return NextResponse.json({ success: true, message: 'Webhook received, but processing failed internally.' });
    }
    
    console.log('[API] ✅ Agent processing and reply reported as successful.');

    // 4. Confirm Reception
    return NextResponse.json({ success: true, message: 'Email received and processed' });

  } catch (error: any) {
    console.error('[API] ❌ Critical error in email-ingest webhook:', error);
    console.error('[API] ❌ Error stack:', error.stack);
    return NextResponse.json({ success: false, error: 'Failed to process the request body.' }, { status: 500 });
  }
}
