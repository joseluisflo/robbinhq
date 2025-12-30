import { WebSocket } from 'ws';
import { GoogleGenAI, type LiveSession, Modality } from "@google/genai";
import { Buffer } from "node:buffer";
import { downsampleBuffer, linear16ToMuLaw } from "@/lib/audioUtils";

interface MinimalLiveSession extends LiveSession {
  close(): void;
  sendRealtimeInput(request: { audio: { data: string, mimeType: string } } | { text: string }): void;
}

// ✅ UTILS: Correcto. Mantén esto aquí o muévelo a @/lib/audioUtils para limpieza.
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

export class CallHandler {
  private ws: WebSocket;
  private googleAISession: MinimalLiveSession | null = null;
  private twilioStreamSid: string | null = null;
  private audioChunkCount: number = 0;

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
        console.log(`[Handler] 🎬 Stream started: ${this.twilioStreamSid}`);

        const params = twilioMessage.start.customParameters || {};
        const systemInstruction = params.systemInstruction 
            ? Buffer.from(params.systemInstruction, 'base64').toString('utf-8') 
            : "You are a helpful voice assistant.";
        const agentVoice = params.agentVoice || 'Zephyr';

        console.log(`[Handler] 📝 System instruction length: ${systemInstruction.length} chars`);
        console.log(`[Handler] 🗣️ Agent voice: ${agentVoice}`);

        await this.connectToGoogleAI(systemInstruction, agentVoice);

      } else if (twilioMessage.event === 'media') {
        // ✅ CORRECCIÓN APLICADA: No incrementes chunkCount si no hay sesión
        if (!this.googleAISession) return;
        
        this.audioChunkCount++;
        
        const audioBuffer = Buffer.from(twilioMessage.media.payload, 'base64');
        
        // Cadena de conversión: MuLaw 8k -> PCM 8k -> PCM 16k
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

  private sendAudioToGoogle(base64Payload: string) {
    // Ya verificamos this.googleAISession en handleMessage, pero por seguridad:
    if (!this.googleAISession) return;

    try {
      // Logs reducidos para no saturar consola
      if (this.audioChunkCount % 100 === 0) {
        console.log(`[Handler] 📤 Sending chunk #${this.audioChunkCount}`);
      }
      
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
            console.log("[Handler] ✅ Google AI session opened successfully!");
            // ⭐ TRUCO IMPORTANTE: Hacer que la IA hable primero
            setTimeout(() => {
                console.log("[Handler] ⚡ Sending trigger message to wake up AI");
                this.googleAISession?.sendRealtimeInput({
                    text: "start conversation" 
                });
            }, 200);
          },
          onmessage: (message) => {
            try {
              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              
              if (audioData && this.twilioStreamSid) {
                // Cadena de conversión inversa: Google 24k -> PCM 8k -> MuLaw
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
              console.error("[Handler] ❌ Error processing Google AI response:", err);
            }
          },
          onerror: (e) => {
            console.error("[Handler] ❌ Google AI Error:", e);
            // No cerramos el socket inmediatamente para evitar desconexiones bruscas por errores transitorios,
            // pero si es fatal, Twilio cerrará la llamada eventualmente.
          },
          onclose: () => {
            console.log("[Handler] 🔌 Google AI session closed.");
          },
        },
      })) as MinimalLiveSession;
      
      console.log("[Handler] ✅ Google AI connection established successfully!");
    } catch (error) {
      console.error("[Handler] ❌ Failed to connect to Google AI:", error);
      this.ws.close(1011, "Could not connect to AI service.");
    }
  }

  private onClose() {
    console.log("[Handler] 🔌 Connection closed.");
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