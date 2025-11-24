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
  
  // Fetch agent configuration from Firestore
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

  const cleanHost = partykitHost.replace(/^https?:\/\//, '');
  const streamUrl = `wss://${cleanHost}/party/${callSid}`;

  console.log(`[Vercel Webhook] Incoming call for agent ${agentId}. Responding with TwiML to stream to PartyKit: ${streamUrl}`);

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

  // CRITICAL: Add a pause to keep the call alive while the stream connects.
  response.pause({ length: 60 });
  
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
