
'use server';

import { NextResponse } from 'next/server';
import { twiml } from 'twilio';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return new Response('Agent ID is required', { status: 400 });
  }

  // The CallSid is provided by Twilio in the POST request body
  const formData = await request.formData();
  const callSid = formData.get('CallSid') as string;

  // IMPORTANT: This now points to our new serverless-friendly webhook,
  // NOT a WebSocket (wss://) address.
  const streamUrl = `/api/twilio/stream?agentId=${agentId}&callSid=${callSid}`;

  const response = new twiml.VoiceResponse();
  const connect = response.connect();

  // Use the <Stream> verb to send audio to our new webhook
  connect.stream({
    url: streamUrl,
  });

  console.log(`Incoming call for agent ${agentId}. Responding with TwiML to stream to: ${streamUrl}`);
  
  // Respond with TwiML
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
