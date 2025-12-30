import { WebSocket } from 'ws';
import { GoogleGenAI, type LiveSession, Modality } from "@google/genai";
import { Buffer } from "node:buffer";
import { downsampleBuffer, linear16ToMuLaw } from "@/lib/audioUtils";

interface MinimalLiveSession extends LiveSession {
  close(): void;
  sendRealtimeInput(request: { audio: { data: string, mimeType: string } } | { text: string }): void;
}

export class CallHandler {
  private ws: WebSocket;
  private googleAISession: MinimalLiveSession | null = null;
  private twilioStreamSid: string | null = null;
  private codec: string = 'pcm';
  private sampleRate: number = 16000;

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
        this.codec = params.codec || 'pcm';
        this.sampleRate = parseInt(params.sampleRate, 10) || 16000;

        console.log(`[Handler] Codec: ${this.codec}, Rate: ${this.sampleRate}`);

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
      // Google Gemini espera base64 string con el mimeType correcto
      this.googleAISession.sendRealtimeInput({
        audio: { 
          data: base64Payload,
          mimeType: `audio/pcm;rate=${this.sampleRate}`
        }
      });
    } catch (err) {
      console.error("[Handler] Error sending audio to Google:", err);
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
          inputAudioConfig: {
            encoding: 'PCM16', // Asegúrate de usar PCM16
            sampleRateHertz: this.sampleRate,
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
            console.log("[Handler] Google AI session opened.");
          },
          onmessage: (message) => {
            try {
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
            } catch (err) {
              console.error("[Handler] Error processing Google AI response:", err);
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