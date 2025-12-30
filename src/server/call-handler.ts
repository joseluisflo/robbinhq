import { WebSocket } from 'ws';
import { GoogleGenAI, type LiveSession, Modality } from "@google/genai";
import { Buffer } from "node:buffer";

// -------------------------------------------------------------------------
// FUNCIONES DE AUDIO
// -------------------------------------------------------------------------

// 1. Entrada: Mu-Law (Twilio 8k) -> PCM 16-bit
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

// 2. Entrada: Upsample 8k -> 16k (Para cumplir con la API de Google)
function upsample8kTo16k(buffer8k: Buffer): Buffer {
  const buffer16k = Buffer.alloc(buffer8k.length * 2);
  for (let i = 0; i < buffer8k.length / 2; i++) {
    const sample = buffer8k.readInt16LE(i * 2);
    buffer16k.writeInt16LE(sample, i * 4);
    buffer16k.writeInt16LE(sample, i * 4 + 2);
  }
  return buffer16k;
}

// 3. Salida: Downsample 24k (Google) -> 8k (Twilio)
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

// 4. Salida: PCM 16-bit -> Mu-Law (Twilio)
function linear16ToMuLaw(pcmBuffer: Buffer): Buffer {
  const muBuffer = Buffer.alloc(pcmBuffer.length / 2);
  for (let i = 0; i < pcmBuffer.length; i += 2) {
    let sample = pcmBuffer.readInt16LE(i);
    const sign = sample < 0 ? 0x80 : 0;
    if (sample < 0) sample = -sample;
    
    // Clipping a 16-bit
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
    mu &= 0xFF; // Asegura byte positivo

    muBuffer.writeUInt8(mu, i / 2);
  }
  return muBuffer;
}

// -------------------------------------------------------------------------
// CLASE PRINCIPAL
// -------------------------------------------------------------------------

interface MinimalLiveSession extends LiveSession {
  close(): void;
  sendRealtimeInput(request: { audio: { data: string, mimeType: string } } | { text: string }): void;
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
        if (!this.googleAISession) return;
        
        this.audioChunkCount++;
        
        const audioBuffer = Buffer.from(twilioMessage.media.payload, 'base64');
        
        // Conversión: Twilio(MuLaw 8k) -> PCM 8k -> PCM 16k -> Google
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
    if (!this.googleAISession) return;

    try {
      // Loguear solo ocasionalmente para no saturar la consola
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
          
          // 🔥 1. FORMATO DE AUDIO (Indispensable para que Google entienda el stream)
          inputAudioConfig: {
            encoding: 'PCM16',
            sampleRateHertz: 16000,
          },

          // 🔥 2. CONFIGURACIÓN DE BARGE-IN (Lo que faltaba)
          // Esto le dice al modelo que escuche interrupciones mientras habla
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
            console.log("[Handler] ✅ Google AI session opened successfully!");
            // Mensaje inicial para activar la conversación
            setTimeout(() => {
                console.log("[Handler] ⚡ Sending trigger message");
                this.googleAISession?.sendRealtimeInput({
                    text: "Hello" 
                });
            }, 200);
          },
          onmessage: (message) => {
            try {
              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              
              if (audioData && this.twilioStreamSid) {
                // Conversión: Google(24k) -> PCM 8k -> Twilio(MuLaw)
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