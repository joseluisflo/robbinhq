import type * as Party from "partykit/server";
import { GoogleGenAI, type LiveSession, Modality } from "@google/genai";
import { Buffer } from "node:buffer";
import { downsampleBuffer, linear16ToMuLaw } from "../audioUtils";

interface MinimalLiveSession extends LiveSession {
  close(): void;
  sendRealtimeInput(request: { audio: { data: string } } | { text: string }): void;
}

// Mu-law to 16-bit linear PCM conversion table
const muLawToLinear16Table = new Int16Array(256);
for (let i = 0; i < 256; i++) {
    let sample = ~i;
    let sign = (sample & 0x80) ? -1 : 1;
    let exponent = (sample >> 4) & 0x07;
    let mantissa = sample & 0x0F;
    let linear = (mantissa << 1) + 33;
    linear <<= (exponent + 2);
    linear -= 33;
    muLawToLinear16Table[i] = sign * linear;
}

function muLawToLinear16(muLawBuffer: Buffer): Buffer {
    const output = new Int16Array(muLawBuffer.length);
    for (let i = 0; i < muLawBuffer.length; i++) {
        output[i] = muLawToLinear16Table[muLawBuffer[i]];
    }
    return Buffer.from(output.buffer);
}

function upsampleTo16k(pcm8k: Buffer): Buffer {
    const samples8k = new Int16Array(pcm8k.buffer, pcm8k.byteOffset, pcm8k.length / 2);
    const samples16k = new Int16Array(samples8k.length * 2);
    for (let i = 0; i < samples8k.length; i++) {
        const sample = samples8k[i];
        samples16k[i * 2] = sample;
        samples16k[i * 2 + 1] = sample;
    }
    return Buffer.from(samples16k.buffer);
}


export default class CallServer implements Party.Server {
  googleAISession: MinimalLiveSession | null = null;
  twilioStreamSid: string | null = null;

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[PartyKit] WebSocket connected: ${conn.id}`);
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const twilioMessage = JSON.parse(message);

      if (twilioMessage.event === "start") {
        this.twilioStreamSid = twilioMessage.start.streamSid;
        console.log(`[PartyKit] Stream started: ${this.twilioStreamSid}`);

        const params = twilioMessage.start.customParameters || {};
        const systemInstruction = params.systemInstruction 
            ? Buffer.from(params.systemInstruction, 'base64').toString('utf-8') 
            : "You are a helpful voice assistant.";
        const agentVoice = params.agentVoice || 'Zephyr';

        await this.connectToGoogleAI(systemInstruction, agentVoice, sender);
      } else if (twilioMessage.event === 'media') {
        if (this.googleAISession) {
          this.sendAudioToGoogle(twilioMessage.media.payload);
        }
      } else if (twilioMessage.event === 'stop') {
        console.log('[PartyKit] Twilio stream stopped.');
        this.onClose();
      }
    } catch (e) {
      console.error("[PartyKit] Error processing message:", e);
    }
  }

  sendAudioToGoogle(base64Payload: string) {
    if (!this.googleAISession) return;
    try {
      const muLawBuffer = Buffer.from(base64Payload, 'base64');
      const pcm8kBuffer = muLawToLinear16(muLawBuffer);
      const pcm16kBuffer = upsampleTo16k(pcm8kBuffer);
      const pcmBase64 = pcm16kBuffer.toString('base64');
      
      this.googleAISession.sendRealtimeInput({
        audio: { data: pcmBase64 }
      });
    } catch (err) {
      console.error("[PartyKit] Error converting or sending audio to Google:", err);
    }
  }

  async connectToGoogleAI(systemInstruction: string, agentVoice: string, twilioConn: Party.Connection) {
    if (!process.env.GEMINI_API_KEY) {
      console.error("[PartyKit] GEMINI_API_KEY is not set.");
      twilioConn.close(1011, "AI service not configured.");
      return;
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

    try {
      this.googleAISession = (await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: agentVoice } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("[PartyKit] Google AI session opened.");
          },
          onmessage: (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && this.twilioStreamSid) {
              const pcm24kBuffer = Buffer.from(audioData, 'base64');
              const pcm8kBuffer = downsampleBuffer(pcm24kBuffer, 24000, 8000);
              const muLawBuffer = linear16ToMuLaw(pcm8kBuffer);
              
              const twilioMessage = {
                event: "media",
                streamSid: this.twilioStreamSid,
                media: { payload: muLawBuffer.toString('base64') },
              };
              twilioConn.send(JSON.stringify(twilioMessage));
            }
          },
          onerror: (e) => {
            console.error("[PartyKit] Google AI Error:", e);
            twilioConn.close(1011, "An AI service error occurred.");
          },
          onclose: () => {
            console.log("[PartyKit] Google AI session closed.");
            if (twilioConn.readyState === WebSocket.OPEN) {
              twilioConn.close(1000, "AI session ended.");
            }
          },
        },
      })) as MinimalLiveSession;
    } catch (error) {
      console.error("[PartyKit] Failed to connect to Google AI:", error);
      twilioConn.close(1011, "Could not connect to AI service.");
    }
  }

  onClose() {
    console.log("[PartyKit] Connection closed. Cleaning up.");
    if (this.googleAISession) {
      this.googleAISession.close();
      this.googleAISession = null;
    }
  }

  onError(conn: Party.Connection, err: Error) {
    console.error(`[PartyKit] Connection error for ${conn.id}:`, err);
    this.onClose();
  }
}

CallServer satisfies Party.Worker;

export class PartyKitDurable extends CallServer {}