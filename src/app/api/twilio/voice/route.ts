
'use server';

import { NextResponse } from 'next/server';
import twilio, { twiml } from 'twilio';
import type { Agent } from '@/lib/types';
import { getPublicAgentById } from '@/lib/data/agents';
import { listAgentFiles } from '@/lib/data/agent-files';
import { listAgentTexts } from '@/lib/data/agent-texts';

function buildRequestValidationUrls(request: Request) {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const candidates = new Set<string>([request.url]);

    if (forwardedHost) {
        candidates.add(`${forwardedProto}://${forwardedHost}${requestUrl.pathname}${requestUrl.search}`);
    }

    if (appUrl) {
        const normalizedAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
        candidates.add(`${normalizedAppUrl}${requestUrl.pathname}${requestUrl.search}`);
    }

    return Array.from(candidates);
}

async function getAgentConfig(agentId: string): Promise<Agent | null> {
    try {
        const agent = await getPublicAgentById(agentId);
        if (!agent) {
          console.warn(`[Vercel Webhook] Agent with ID ${agentId} not found in Postgres.`);
          return null;
        }

        const [textSources, fileSources] = await Promise.all([
          listAgentTexts(agentId),
          listAgentFiles(agentId),
        ]);

        return {
          ...agent,
          textSources,
          fileSources,
        };
    } catch (error) {
        console.error(`[Vercel Webhook] Error fetching agent config for ${agentId}:`, error);
        return null;
    }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    console.error('[Vercel Webhook] Agent ID is required');
    return new Response('Agent ID is required', { status: 400 });
  }

  const formData = await request.formData();
  const signature = request.headers.get('x-twilio-signature');

  if (!process.env.TWILIO_AUTH_TOKEN) {
    console.error('[Vercel Webhook] TWILIO_AUTH_TOKEN is not configured.');
    return new Response('Twilio integration is not configured.', { status: 500 });
  }

  if (!signature) {
    console.error('[Vercel Webhook] Missing X-Twilio-Signature header.');
    return new Response('Missing Twilio signature.', { status: 403 });
  }

  const params = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
  const candidateUrls = buildRequestValidationUrls(request);
  const isValidRequest = candidateUrls.some((candidateUrl) =>
    twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      candidateUrl,
      params
    )
  );

  if (!isValidRequest) {
    console.error('[Vercel Webhook] Invalid Twilio signature.', { candidateUrls });
    return new Response('Invalid Twilio signature.', { status: 403 });
  }

  const callSid = formData.get('CallSid') as string;

  if (!callSid) {
    console.error('[Vercel Webhook] CallSid is missing from Twilio webhook');
    return new Response('CallSid is required', { status: 400 });
  }

  const webSocketServerUrl = process.env.WEBSOCKET_SERVER_URL;
  if (!webSocketServerUrl) {
    console.error('[Vercel Webhook] WEBSOCKET_SERVER_URL is not set.');
    return new Response('Application is not configured for real-time calls.', { status: 500 });
  }
  
  // Fetch agent configuration from Postgres
  const agentConfig = await getAgentConfig(agentId);
  if (!agentConfig) {
      return new Response(`Agent configuration for ${agentId} not found.`, { status: 404 });
  }

  const knowledge = [
      ...(agentConfig.textSources || []).map(t => `Title: ${t.title}\\nContent: ${t.content}`),
      ...(agentConfig.fileSources || []).map(f => `File: ${f.name}\\nContent: ${f.extractedText || ''}`)
  ].join('\\n\\n---\\n\\n');

  const systemInstruction = `
You are a voice AI. Your goal is to be as responsive as possible. Your first response to a user MUST be an immediate, short acknowledgment like "Of course, let me check that" or "Sure, one moment". Then, you will provide the full answer.
This is a real-time conversation. Keep all your answers concise and to the point. Prioritize speed. Do not use filler phrases.
${agentConfig.inCallWelcomeMessage ? `Your very first response in this conversation must be: "${agentConfig.inCallWelcomeMessage}"` : ''}

Your instructions and persona are defined below.

### Instructions & Persona
${agentConfig.instructions || 'You are a helpful assistant.'}
        
### Knowledge Base
Use the following information to answer questions. This is your primary source of truth.
---
${knowledge}
---
  `;

  const streamUrl = webSocketServerUrl;

  console.log(`[Vercel Webhook] Incoming call for agent ${agentId}. Responding with TwiML to stream to: ${streamUrl}`);

  const response = new twiml.VoiceResponse();
  const connect = response.connect();
  
  const stream = connect.stream({
    url: streamUrl,
  });

  // Use <Parameter> to reliably send data in the 'start' event
  stream.parameter({
    name: "systemInstruction",
    // Encode as Base64 to handle long and complex strings safely
    value: Buffer.from(systemInstruction).toString('base64')
  });
  stream.parameter({
    name: "agentVoice",
    value: agentConfig.agentVoice || 'Zephyr'
  });
   stream.parameter({
    name: "agentId",
    value: agentId
  });
   stream.parameter({
    name: "callSid",
    value: callSid
  });
  // Twilio Media Streams send audio in mu-law format. We don't need to specify track or codec here
  // as the server will handle the conversion.

  // CRITICAL: Add a pause to keep the call alive while the stream connects.
  response.pause({ length: 60 });
  
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
