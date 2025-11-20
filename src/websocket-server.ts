
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { config } from 'dotenv';
import { ai } from '@/ai/genkit';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { firebaseAdmin } from '@/firebase/admin';
import { Modality } from '@google/genai';

config();

const port = process.env.WEBSOCKET_PORT || 3001;

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

// A map to store AI live sessions, keyed by a unique identifier (e.g., call SID)
const sessions = new Map<string, any>();

async function getAgentData(agentId: string): Promise<Agent | null> {
  try {
    const firestore = firebaseAdmin.firestore();
    const agentQuerySnapshot = await firestore.collectionGroup('agents').where('__name__', '==', agentId).limit(1).get();

    if (agentQuerySnapshot.empty) {
      console.error(`Agent with ID ${agentId} not found.`);
      return null;
    }
    const agentDoc = agentQuerySnapshot.docs[0];
    const agent = agentDoc.data() as Agent;
    const agentRef = agentDoc.ref;
    
    const textsSnapshot = await agentRef.collection('texts').get();
    const filesSnapshot = await agentRef.collection('files').get();

    agent.textSources = textsSnapshot.docs.map(doc => doc.data() as TextSource);
    agent.fileSources = filesSnapshot.docs.map(doc => doc.data() as AgentFile);

    return agent;
  } catch (error) {
    console.error(`Failed to retrieve agent data for agentId: ${agentId}`, error);
    return null;
  }
}


wss.on('connection', async (ws, req) => {
  const { query } = parse(req.url || '', true);
  const agentId = query.agentId as string;
  const callSid = query.callSid as string; // Twilio Call SID

  if (!agentId || !callSid) {
    console.error('Connection failed: agentId and callSid are required.');
    ws.close();
    return;
  }
  
  console.log(`WebSocket connection established for agent ${agentId} and call ${callSid}`);

  const agent = await getAgentData(agentId);
  if (!agent) {
    console.error(`Could not start session for agent ${agentId}: agent data not found.`);
    ws.close();
    return;
  }

  try {
    const knowledge = [
        ...(agent.textSources || []).map(t => `Title: ${t.title}\nContent: ${t.content}`),
        ...(agent.fileSources || []).map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
    ].join('\n\n---\n\n');

    const systemInstruction = `
        You are a voice AI. Your goal is to be as responsive as possible. Your first response to a user MUST be an immediate, short acknowledgment like "Of course, let me check that" or "Sure, one moment". Then, you will provide the full answer.
        This is a real-time conversation. Keep all your answers concise and to the point. Prioritize speed. Do not use filler phrases.
        ${agent.inCallWelcomeMessage ? `Your very first response in this conversation must be: "${agent.inCallWelcomeMessage}"` : ''}

        Your instructions and persona are defined below.

        ### Instructions & Persona
        ${agent.instructions || 'You are a helpful assistant.'}
                
        ### Knowledge Base
        Use the following information to answer questions. This is your primary source of truth.
        ---
        ${knowledge}
        ---
    `;

    const aiSession = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: { interruptions: true, model: 'chirp' },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.agentVoice || 'Zephyr' } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log(`AI session opened for call ${callSid}`);
            // Send a connected message to Twilio
            ws.send(JSON.stringify({ event: "connected" }));
          },
          onmessage: (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              // This is audio from the AI. Send it to Twilio.
              ws.send(JSON.stringify({
                event: 'media',
                media: {
                  payload: audioData,
                },
              }));
            }
          },
          onerror: (e) => {
            console.error(`AI session error for call ${callSid}:`, e);
          },
          onclose: () => {
            console.log(`AI session closed for call ${callSid}`);
          },
        },
    });

    sessions.set(callSid, aiSession);

    // Initial message to start the conversation
    aiSession.sendRealtimeInput({ text: "start" });


    ws.on('message', (message) => {
        const msg = JSON.parse(message.toString());

        switch (msg.event) {
            case 'media':
                // This is audio from Twilio. Send it to the AI.
                if (aiSession) {
                    aiSession.sendRealtimeInput({
                        media: {
                            data: msg.media.payload,
                            mimeType: 'audio/mulaw', // Twilio uses mu-law
                        }
                    });
                }
                break;
            case 'stop':
                console.log(`Stop message received for call ${callSid}. Cleaning up.`);
                if (aiSession) {
                    aiSession.close();
                    sessions.delete(callSid);
                }
                ws.close();
                break;
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket connection closed for call ${callSid}`);
        const aiSessionToClose = sessions.get(callSid);
        if (aiSessionToClose) {
            aiSessionToClose.close();
            sessions.delete(callSid);
        }
    });

  } catch (error) {
    console.error(`Failed to establish AI session for agent ${agentId}:`, error);
    ws.close();
  }
});

server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);
    if (pathname === '/api/twilio/stream') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`);
});
