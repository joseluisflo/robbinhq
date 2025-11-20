
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('NEXT_PUBLIC_APP_URL is not set. Cannot create a fully qualified URL for Twilio webhook.');
    return new Response('Application URL is not configured.', { status: 500 });
  }
  
  // Ensure the URL uses wss:// protocol and does not contain http/https.
  const websocketHost = appUrl.replace(/^https?:\/\//, '');
  const streamUrl = `wss://${websocketHost}/api/twilio/stream?agentId=${agentId}&callSid=${callSid}`;

  const response = new twiml.VoiceResponse();
  const connect = response.connect();
  
  connect.stream({
    url: streamUrl,
  });

  console.log(`Incoming call for agent ${agentId}. Responding with TwiML to stream to: ${streamUrl}`);
  
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
