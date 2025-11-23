
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

  const partykitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (!partykitHost) {
    console.error('NEXT_PUBLIC_PARTYKIT_HOST is not set.');
    return new Response('Application is not configured for real-time calls.', { status: 500 });
  }
  
  // Construct the PartyKit URL using the production host.
  const streamUrl = `wss://${partykitHost.replace(/^https?:\/\//, '')}/party/${callSid}?agentId=${agentId}`;

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
