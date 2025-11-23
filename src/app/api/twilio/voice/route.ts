'use server';

import { NextResponse } from 'next/server';
import { twiml } from 'twilio';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return new Response('Agent ID is required', { status: 400 });
  }

  const formData = await request.formData();
  const callSid = formData.get('CallSid') as string;

  if (!callSid) {
    console.error('CallSid is missing from Twilio webhook');
    return new Response('CallSid is required', { status: 400 });
  }

  const partykitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (!partykitHost) {
    console.error('NEXT_PUBLIC_PARTYKIT_HOST is not set.');
    return new Response('Application is not configured for real-time calls.', { status: 500 });
  }
  
  // ✅ CAMBIO CRÍTICO: Usar PATH en lugar de query params para WebSocket
  // Formato: wss://domain/party/CALLSID/AGENTID
  const cleanHost = partykitHost.replace(/^https?:\/\//, '');
  const streamUrl = `wss://${cleanHost}/party/${callSid}/${encodeURIComponent(agentId)}`;

  const response = new twiml.VoiceResponse();
  const connect = response.connect();
  
  connect.stream({
    url: streamUrl,
  });

  console.log(`Incoming call for agent ${agentId}. Responding with TwiML to stream to PartyKit: ${streamUrl}`);
  
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}