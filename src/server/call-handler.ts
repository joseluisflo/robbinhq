
import { WebSocket } from 'ws';
import { GoogleGenAI, type LiveSession, Modality } from "@google/genai";
import { Buffer } from "node:buffer";
import { firebaseAdmin } from '@/firebase/admin';
import type { Agent } from '@/lib/types';
import { deductCredits } from '@/lib/credit-service';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  acquireCallLock,
  refreshCallLock,
  releaseCallLock,
  setCallState,
} from '@/lib/realtime-state';


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
  private static readonly CALL_LOCK_TTL_SECONDS = 90;
  private static readonly CALL_STATE_TTL_SECONDS = 120;
  private static readonly HEARTBEAT_INTERVAL_MS = 15_000;

  private ws: WebSocket;
  private googleAISession: MinimalLiveSession | null = null;
  private twilioStreamSid: string | null = null;
  private callSid: string | null = null;
  
  private agentId: string | null = null;
  private ownerId: string | null = null;
  private minuteInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lockOwnerToken: string;
  private isClosed = false;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.lockOwnerToken = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
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
        this.callSid = twilioMessage.start.customParameters?.callSid || null;
        console.log(`[Handler] 🎬 Stream started: ${this.twilioStreamSid} for Agent: ${this.agentId}, CallSid: ${this.callSid}`);

        if (!this.agentId) {
            console.error("[Handler] ❌ Agent ID is missing from custom parameters. Closing connection.");
            this.ws.close(1011, "Agent ID not provided.");
            return;
        }
        if (!this.callSid) {
            console.error("[Handler] ❌ CallSid is missing from custom parameters. Closing connection.");
            this.ws.close(1011, "CallSid not provided.");
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

        const acquiredLock = await acquireCallLock(
          this.callSid,
          this.lockOwnerToken,
          CallHandler.CALL_LOCK_TTL_SECONDS
        );
        if (!acquiredLock) {
          console.warn(`[Handler] ⚠️ Duplicate call session detected for ${this.callSid}. Closing connection.`);
          this.ws.close(4009, "Call already handled by another instance.");
          return;
        }

        const voiceRateLimit = await checkRateLimit(`voice-connect:${this.ownerId}:${this.agentId}`, 10, 60_000);
        if (!voiceRateLimit.allowed) {
          console.warn(`[Handler] ⚠️ Voice connection rate limit exceeded for user ${this.ownerId} and agent ${this.agentId}.`);
          this.ws.close(4010, "Too many call attempts.");
          return;
        }

        await this.persistCallState("starting");
        this.startHeartbeat();

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
        console.log(`[Handler] 🛑 Twilio stream stopped for call ${this.callSid}.`);
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

    const deductAndCheck = async (amount: number) => {
      if (this.ownerId) {
        console.log(`[Handler] 💳 Attempting to deduct ${amount} credits for user ${this.ownerId}.`);
        const result = await deductCredits(this.ownerId, amount, 'Voice Call Usage');
        if (!result.success) {
          console.warn(`[Handler] ⚠️ Insufficient credits for user ${this.ownerId}. Terminating call.`);
          await this.persistCallState("insufficient-credits");
          this.ws.close(4002, "Insufficient credits"); // This will trigger the onClose event
        }
      }
    };
    
    // Deduct initial credit for the first minute
    deductAndCheck(10);

    this.minuteInterval = setInterval(() => {
        deductAndCheck(10);
    }, 60000);
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (!this.callSid) {
        return;
      }

      await refreshCallLock(
        this.callSid,
        this.lockOwnerToken,
        CallHandler.CALL_LOCK_TTL_SECONDS
      );
      await this.persistCallState(this.googleAISession ? "active" : "connecting");
    }, CallHandler.HEARTBEAT_INTERVAL_MS);
  }

  private async persistCallState(status: string) {
    if (!this.callSid) {
      return;
    }

    await setCallState(
      this.callSid,
      {
        callSid: this.callSid,
        streamSid: this.twilioStreamSid,
        agentId: this.agentId,
        ownerId: this.ownerId,
        status,
        updatedAt: new Date().toISOString(),
      },
      CallHandler.CALL_STATE_TTL_SECONDS
    );
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
            void this.persistCallState("connected");
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
            void this.persistCallState("ai-error");
          },
          onclose: () => {
            console.log("[Handler] 🔌 Google AI session closed.");
            void this.persistCallState("ai-closed");
          },
        },
      })) as MinimalLiveSession;
    } catch (error) {
      console.error("[Handler] ❌ Connection failed:", error);
      await this.persistCallState("connection-failed");
      this.ws.close(1011, "Connection failed.");
    }
  }

  private async onClose() {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;

    console.log(`[Handler] 🔌 Connection closed for call ${this.callSid}.`);
    if (this.minuteInterval) {
        clearInterval(this.minuteInterval);
        this.minuteInterval = null;
        console.log("[Handler] ⏱️ Billing timer stopped.");
    }
    if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
    }
    if (this.googleAISession) {
      this.googleAISession.close();
      this.googleAISession = null;
    }
    if (this.callSid) {
      await this.persistCallState("closed");
      await releaseCallLock(this.callSid);
    }
  }

  private onError(err: Error) {
    console.error(`[Handler] ❌ WebSocket error:`, err);
    void this.persistCallState("socket-error");
    void this.onClose();
  }
}
