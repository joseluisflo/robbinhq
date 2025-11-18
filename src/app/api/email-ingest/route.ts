
'use server';

import { NextResponse } from 'next/server';
import { processInboundEmail } from '@/app/actions/email';

const INGEST_SECRET = process.env.EMAIL_INGEST_SECRET;

export async function POST(request: Request) {
  // 1. Security Check
  if (INGEST_SECRET) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${INGEST_SECRET}`) {
      console.warn('Unauthorized attempt to access email-ingest webhook.');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('EMAIL_INGEST_SECRET is not set. The webhook is not secure.');
  }

  try {
    const payload = await request.json();

    // 2. Extract Data
    const from = payload.from;
    const to = payload.to;
    const subject = payload.subject;
    const body = payload.text || payload.html || 'No content';

    if (!from || !to || !subject) {
        return NextResponse.json({ success: false, error: 'Missing required email fields (from, to, subject).' }, { status: 400 });
    }

    console.log('--- Email Ingest Webhook Received ---');
    console.log('From:', from);
    console.log('To:', to);
    
    // 3. Process Email
    const result = await processInboundEmail({ from, to, subject, body });

    if ('error' in result) {
        console.error('Failed to process email:', result.error);
        // Still respond 200 OK to Plunk to prevent retries. The error is logged on our end.
        return NextResponse.json({ success: true, message: 'Webhook received, but processing failed internally.' });
    }
    
    console.log('--- Agent processing and reply complete ---');

    // 4. Confirm Reception
    return NextResponse.json({ success: true, message: 'Email received and processed' });

  } catch (error: any) {
    console.error('Error in email-ingest webhook:', error);
    return NextResponse.json({ success: false, error: 'Failed to process the request body.' }, { status: 500 });
  }
}
