
import { WebSocket } from 'ws';
import { GoogleGenAI, type LiveSession, Modality } from "@google/genai";
import { Buffer } from "node:buffer";
import { firebaseAdmin } from '@/firebase/admin';
import type { Agent } from '@/lib/types';
import { deductCredits } from '@/lib/credit-service';


// -------------------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------------------

async function findAgentAndOwner(firestore: FirebaseFirestore.Firestore, agentId: string): Promise<{ agent: Agent, ownerId: string } | null> {
    if (!agentId) return null;
    const indexRef = firestore.collection('agentIndex').doc(agentId);
    const indexDoc = await indexRef.get();

    if (indexDoc.exists) {
        const { ownerId } = indexDoc.data() as { ownerId: string };
        if (ownerId) {
            const agentRef = firestore.collection('users').doc(ownerId).collection('agents').doc(agentId);
            const agentDoc = await agentRef.get();
            if (agentDoc.exists) {
                console.log(`[CallHandler] Agent ${agentId} found in index for owner ${ownerId}.`);
                return {
                    agent: { id: agentDoc.id, ...agentDoc.data() } as Agent,
                    ownerId: ownerId,
                };
            }
        }
    }
    console.error(`[CallHandler] Agent with ID ${agentId} not found in index.`);
    return null;
}


// -------------------------------------------------------------------------
// AUDIO FUNCTIONS
// -------------------------------------------------------------------------

function muLawToLinear16(muLawBuffer: Buffer): Buffer {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  for (let i = 0; i < muLawBuffer.length; i++) {
    const mu = muLawBuffer[i];
    let t = ~mu;
    let sign = (t & 0x80) >> 7;
    let exponent = (t & 0x70) >> 4;
    let mantissa = t & 0x0f;
    let sample = ((mantissa << 3) + 0x84) << exponent;
    sample -= 0x84;
    if (sign === 0) sample = -sample;
    pcmBuffer.writeInt16LE(sample, i * 2);
  }
  return pcmBuffer;
}

function upsample8kTo16k(buffer8k: Buffer): Buffer {
  const buffer16k = Buffer.alloc(buffer8k.length * 2);
  for (let i = 0; i < buffer8k.length / 2; i++) {
    const sample = buffer8k.readInt16LE(i * 2);
    buffer16k.writeInt16LE(sample, i * 4);
    buffer16k.writeInt16LE(sample, i * 4 + 2);
  }
  return buffer16k;
}

function downsampleBuffer(buffer: Buffer, inputRate: number, outputRate: number): Buffer {
  if (inputRate === outputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.floor(buffer.length / 2 / ratio) * 2;
  const result = Buffer.alloc(newLength);
  
  for (let i = 0; i < newLength / 2; i++) {
    const originalIndex = Math.floor(i * ratio) * 2;
    if (originalIndex < buffer.length - 1) {
        const val = buffer.readInt16LE(originalIndex);
        result.writeInt16LE(val, i * 2);
    }
  }
  return result;
}

function linear16ToMuLaw(pcmBuffer: Buffer): Buffer {
  const muBuffer = Buffer.alloc(pcmBuffer.length / 2);
  for (let i = 0; i < pcmBuffer.length; i += 2) {
    let sample = pcmBuffer.readInt16LE(i);
    const sign = sample < 0 ? 0x80 : 0;
    if (sample < 0) sample = -sample;
    
    sample = Math.min(sample + 0x84, 0x7fff);
    
    let exponent = 7;
    for (let exp = 0; exp < 8; exp++) {
        if (sample < (0x84 << (exp + 1))) {
            exponent = exp;
            break;
        }
    }
    
    let mantissa = (sample >> (exponent + 3)) & 0x0f;
    
    let mu = ~(sign | (exponent << 4) | mantissa);
    mu &= 0xFF; 

    muBuffer.writeUInt8(mu, i / 2);
  }
  return muBuffer;
}

// -------------------------------------------------------------------------
// MAIN CLASS
// -------------------------------------------------------------------------

interface MinimalLiveSession extends LiveSession {
  close(): void;
  sendRealtimeInput(request: { audio: { data: string, mimeType: string } } | { text: string }): void;
}

export class CallHandler {
  private ws: WebSocket;
  private googleAISession: MinimalLiveSession | null = null;
  private twilioStreamSid: string | null = null;
  
  private agentId: string | null = null;
  private ownerId: string | null = null;
  private minuteInterval: NodeJS.Timer | null = null;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.on('message', this.handleMessage.bind(this));
    this.ws.on('close', this.onClose.bind(this));
    this.ws.on('error', this.onError.bind(this));
  }

  private async handleMessage(message: Buffer | string) {
    try {
      const messageStr = message.toString();
      const twilioMessage = JSON.parse(messageStr);

      if (twilioMessage.event === "start") {
        this.twilioStreamSid = twilioMessage.start.streamSid;
        this.agentId = twilioMessage.start.customParameters?.agentId || null;
        console.log(`[Handler] 🎬 Stream started: ${this.twilioStreamSid} for Agent: ${this.agentId}`);

        if (!this.agentId) {
            console.error("[Handler] ❌ Agent ID is missing from custom parameters. Closing connection.");
            this.ws.close(1011, "Agent ID not provided.");
            return;
        }

        const agentInfo = await findAgentAndOwner(firebaseAdmin.firestore(), this.agentId);
        if (!agentInfo) {
            console.error(`[Handler] ❌ Agent ${this.agentId} not found. Closing connection.`);
            this.ws.close(1011, "Agent not found.");
            return;
        }
        this.ownerId = agentInfo.ownerId;
        console.log(`[Handler] 👤 Agent owner identified: ${this.ownerId}`);

        // Start billing timer
        this.startBilling();


        const params = twilioMessage.start.customParameters || {};
        const systemInstruction = params.systemInstruction 
            ? Buffer.from(params.systemInstruction, 'base64').toString('utf-8') 
            : "You are a helpful voice assistant.";
        const agentVoice = params.agentVoice || 'Zephyr';

        console.log(`[Handler] 🗣️ Agent voice: ${agentVoice}`);
        await this.connectToGoogleAI(systemInstruction, agentVoice);

      } else if (twilioMessage.event === 'media') {
        if (!this.googleAISession) return;
        
        const audioBuffer = Buffer.from(twilioMessage.media.payload, 'base64');
        const pcm8k = muLawToLinear16(audioBuffer);
        const pcm16k = upsample8kTo16k(pcm8k);
        
        this.sendAudioToGoogle(pcm16k.toString('base64'));

      } else if (twilioMessage.event === 'stop') {
        console.log('[Handler] 🛑 Twilio stream stopped.');
        this.onClose();
      }
    } catch (e) {
      console.error("[Handler] ❌ Error processing message:", e);
    }
  }

  private startBilling() {
    if (this.minuteInterval) {
        clearInterval(this.minuteInterval);
    }
    
    // Deduct initial credit for the first minute
    if (this.ownerId) {
        deductCredits(this.ownerId, 2);
    }

    this.minuteInterval = setInterval(async () => {
        if (this.ownerId) {
            console.log(`[Handler] 💳 Attempting to deduct 2 credits for user ${this.ownerId} for another minute of call.`);
            const result = await deductCredits(this.ownerId, 2);
            if (!result.success) {
                console.warn(`[Handler] ⚠️ Insufficient credits for user ${this.ownerId}. Terminating call.`);
                this.ws.close(4002, "Insufficient credits"); // This will trigger the onClose event
            }
        }
    }, 60000);
  }

  private sendAudioToGoogle(base64Payload: string) {
    if (!this.googleAISession) return;
    try {
      this.googleAISession.sendRealtimeInput({
        audio: { 
          data: base64Payload,
          mimeType: `audio/pcm;rate=16000`
        }
      });
    } catch (err) {
      console.error("[Handler] ❌ Error sending audio to Google:", err);
    }
  }

  private sendClearToTwilio() {
    if (this.ws.readyState === WebSocket.OPEN && this.twilioStreamSid) {
        const clearMessage = {
            event: "clear",
            streamSid: this.twilioStreamSid,
        };
        this.ws.send(JSON.stringify(clearMessage));
    }
  }

  private async connectToGoogleAI(systemInstruction: string, agentVoice: string) {
    if (!process.env.GEMINI_API_KEY) {
      console.error("[Handler] ❌ GEMINI_API_KEY is not set.");
      this.ws.close(1011, "AI service not configured.");
      return;
    }
    
    console.log("[Handler] 🔌 Connecting to Google AI...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

    try {
      this.googleAISession = (await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioConfig: {
            encoding: 'PCM16',
            sampleRateHertz: 16000,
          },
          inputAudioTranscription: {
            interruptions: true
          },
          outputAudioConfig: {
            encoding: 'PCM16',
            sampleRateHertz: 24000,
          },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: agentVoice } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("[Handler] ✅ Connected to Google AI");
            setTimeout(() => {
                this.googleAISession?.sendRealtimeInput({ text: "Hello" });
            }, 200);
          },
          onmessage: (message) => {
            try {
              const serverContent = message.serverContent;

              if (serverContent?.turnComplete && serverContent?.interrupted) {
                  console.log("[Handler] ⚡ Interruption detected! Clearing Twilio buffer.");
                  this.sendClearToTwilio();
              }

              const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              
              if (audioData && this.twilioStreamSid) {
                const pcm24kBuffer = Buffer.from(audioData, 'base64');
                const pcm8kBuffer = downsampleBuffer(pcm24kBuffer, 24000, 8000);
                const muLawBuffer = linear16ToMuLaw(pcm8kBuffer);
                
                const twilioResponse = {
                  event: "media",
                  streamSid: this.twilioStreamSid,
                  media: { payload: muLawBuffer.toString('base64') },
                };
                
                if (this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(JSON.stringify(twilioResponse));
                }
              }
            } catch (err) {
              console.error("[Handler] ❌ Error processing AI response:", err);
            }
          },
          onerror: (e) => {
            console.error("[Handler] ❌ Google AI Error:", e);
          },
          onclose: () => {
            console.log("[Handler] 🔌 Google AI session closed.");
          },
        },
      })) as MinimalLiveSession;
    } catch (error) {
      console.error("[Handler] ❌ Connection failed:", error);
      this.ws.close(1011, "Connection failed.");
    }
  }

  private onClose() {
    console.log("[Handler] 🔌 Connection closed.");
    if (this.minuteInterval) {
        clearInterval(this.minuteInterval);
        this.minuteInterval = null;
        console.log("[Handler] ⏱️ Billing timer stopped.");
    }
    if (this.googleAISession) {
      this.googleAISession.close();
      this.googleAISession = null;
    }
  }

  private onError(err: Error) {
    console.error(`[Handler] ❌ WebSocket error:`, err);
    this.onClose();
  }
}
