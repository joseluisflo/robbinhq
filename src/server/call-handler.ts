import { WebSocket } from 'ws';
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


export class CallHandler {
  private ws: WebSocket;
  private googleAISession: MinimalLiveSession | null = null;
  private twilioStreamSid: string | null = null;

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
        console.log(`[Handler] Stream started: ${this.twilioStreamSid}`);

        const params = twilioMessage.start.customParameters || {};
        const systemInstruction = params.systemInstruction 
            ? Buffer.from(params.systemInstruction, 'base64').toString('utf-8') 
            : "You are a helpful voice assistant.";
        const agentVoice = params.agentVoice || 'Zephyr';

        await this.connectToGoogleAI(systemInstruction, agentVoice);
      } else if (twilioMessage.event === 'media') {
        if (this.googleAISession) {
          this.sendAudioToGoogle(twilioMessage.media.payload);
        }
      } else if (twilioMessage.event === 'stop') {
        console.log('[Handler] Twilio stream stopped.');
        this.onClose();
      }
    } catch (e) {
      console.error("[Handler] Error processing message:", e);
    }
  }

  private sendAudioToGoogle(base64Payload: string) {
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
      console.error("[Handler] Error converting or sending audio to Google:", err);
    }
  }

  private async connectToGoogleAI(systemInstruction: string, agentVoice: string) {
    if (!process.env.GEMINI_API_KEY) {
      console.error("[Handler] GEMINI_API_KEY is not set.");
      this.ws.close(1011, "AI service not configured.");
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
            console.log("[Handler] Google AI session opened.");
            this.googleAISession?.sendRealtimeInput({ text: "start" });
          },
          onmessage: (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
          },
          onerror: (e) => {
            console.error("[Handler] Google AI Error:", e);
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1011, "An AI service error occurred.");
            }
          },
          onclose: () => {
            console.log("[Handler] Google AI session closed.");
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.close(1000, "AI session ended.");
            }
          },
        },
      })) as MinimalLiveSession;
    } catch (error) {
      console.error("[Handler] Failed to connect to Google AI:", error);
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1011, "Could not connect to AI service.");
      }
    }
  }

  private onClose() {
    console.log("[Handler] Connection closed. Cleaning up.");
    if (this.googleAISession) {
      this.googleAISession.close();
      this.googleAISession = null;
    }
  }

  private onError(err: Error) {
    console.error(`[Handler] WebSocket error:`, err);
    this.onClose();
  }
}
