
'use server';

import { NextResponse } from 'next/server';
import { twiml } from 'twilio';
import { firebaseAdmin } from '@/firebase/admin';
import type { Agent, AgentFile, TextSource } from '@/lib/types';


async function getAgentConfig(agentId: string): Promise<Agent | null> {
    const firestore = firebaseAdmin.firestore();
    try {
        const usersSnapshot = await firestore.collection('users').get();
        for (const userDoc of usersSnapshot.docs) {
            const agentRef = firestore.collection('users').doc(userDoc.id).collection('agents').doc(agentId);
            const agentDoc = await agentRef.get();

            if (agentDoc.exists) {
                console.log(`[Vercel Webhook] Found agent ${agentId} for user ${userDoc.id}`);
                const agentData = agentDoc.data() as Agent;

                // Fetch subcollections for knowledge
                const textsSnapshot = await agentRef.collection('texts').get();
                const filesSnapshot = await agentRef.collection('files').get();

                agentData.textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
                agentData.fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);
                
                return agentData;
            }
        }
        console.warn(`[Vercel Webhook] Agent with ID ${agentId} not found across all users.`);
        return null;
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
  const callSid = formData.get('CallSid') as string;

  if (!callSid) {
    console.error('[Vercel Webhook] CallSid is missing from Twilio webhook');
    return new Response('CallSid is required', { status: 400 });
  }

  const partykitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (!partykitHost) {
    console.error('[Vercel Webhook] NEXT_PUBLIC_PARTYKIT_HOST is not set.');
    return new Response('Application is not configured for real-time calls.', { status: 500 });
  }

  // Build the WebSocket URL with configuration in query parameters
  const cleanHost = partykitHost.replace(/^https?:\/\//, '');
  const url = new URL(`https://${cleanHost}/party/${callSid}`);
  
  // Pass agentId as a query parameter
  url.searchParams.set("agentId", agentId);
  
  const streamUrl = `wss://${url.host}${url.pathname}${url.search}`;

  const response = new twiml.VoiceResponse();
  const connect = response.connect();
  
  connect.stream({
    url: streamUrl,
  });

  console.log(`[Vercel Webhook] Incoming call for agent ${agentId}. Responding with TwiML to stream to PartyKit: ${streamUrl}`);
  
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
