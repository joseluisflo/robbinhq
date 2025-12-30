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

      // 🔍 LOG: Mostrar qué evento recibimos
      console.log(`[Handler] 📨 Received event: ${twilioMessage.event}`);

      if (twilioMessage.event === "start") {
        this.twilioStreamSid = twilioMessage.start.streamSid;
        console.log(`[Handler] 🎬 Stream started: ${this.twilioStreamSid}`);

        const params = twilioMessage.start.customParameters || {};
        const systemInstruction = params.systemInstruction 
            ? Buffer.from(params.systemInstruction, 'base64').toString('utf-8') 
            : "You are a helpful voice assistant.";
        const agentVoice = params.agentVoice || 'Zephyr';
        this.codec = params.codec || 'pcm';
        this.sampleRate = parseInt(params.sampleRate, 10) || 16000;

        console.log(`[Handler] 🎙️ Codec: ${this.codec}, Rate: ${this.sampleRate}`);
        console.log(`[Handler] 📝 System instruction length: ${systemInstruction.length} chars`);
        console.log(`[Handler] 🗣️ Agent voice: ${agentVoice}`);

        await this.connectToGoogleAI(systemInstruction, agentVoice);
      } else if (twilioMessage.event === 'media') {
        // 🔍 LOG: Contar chunks de audio recibidos
        this.audioChunkCount++;
        if (this.audioChunkCount % 50 === 0) {
          console.log(`[Handler] 🎵 Received ${this.audioChunkCount} audio chunks so far`);
        }
        
        const payloadLength = twilioMessage.media.payload?.length || 0;
        if (this.audioChunkCount <= 3) {
          console.log(`[Handler] 🎵 Media chunk #${this.audioChunkCount}, payload length: ${payloadLength}`);
        }
        
        if (this.googleAISession) {
          this.sendAudioToGoogle(twilioMessage.media.payload);
        } else {
          console.error(`[Handler] ⚠️ Received media but Google AI session is not ready!`);
        }
      } else if (twilioMessage.event === 'stop') {
        console.log('[Handler] 🛑 Twilio stream stopped.');
        this.onClose();
      }
    } catch (e) {
      console.error("[Handler] ❌ Error processing message:", e);
    }
  }

  private sendAudioToGoogle(base64Payload: string) {
    if (!this.googleAISession) {
      console.error("[Handler] ❌ Cannot send audio: Google AI session is null");
      return;
    }
    try {
      // 🔍 LOG: Mostrar cada 50 chunks para no saturar
      if (this.audioChunkCount % 50 === 0) {
        console.log(`[Handler] 📤 Sending audio to Google, chunk size: ${base64Payload.length} chars`);
      }
      
      this.googleAISession.sendRealtimeInput({
        audio: { 
          data: base64Payload,
          mimeType: `audio/pcm;rate=${this.sampleRate}`
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
            console.log("[Handler] ✅ Google AI session opened successfully!");
          },
          onmessage: (message) => {
            try {
              // 🔍 LOG: Importante - ver si Google responde
              console.log("[Handler] ⭐ Received message from Google AI");
              
              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              
              if (audioData) {
                console.log(`[Handler] 🔊 Google sent audio data: ${audioData.length} chars (base64)`);
              } else {
                console.log("[Handler] ⚠️ Google message received but no audio data");
                console.log("[Handler] 📋 Message structure:", JSON.stringify(message).substring(0, 500));
              }
              
              if (audioData && this.twilioStreamSid) {
                const pcm24kBuffer = Buffer.from(audioData, 'base64');
                console.log(`[Handler] 🔄 Converting audio: PCM 24kHz (${pcm24kBuffer.length} bytes)`);
                
                const pcm8kBuffer = downsampleBuffer(pcm24kBuffer, 24000, 8000);
                console.log(`[Handler] 🔄 Downsampled to 8kHz (${pcm8kBuffer.length} bytes)`);
                
                const muLawBuffer = linear16ToMuLaw(pcm8kBuffer);
                console.log(`[Handler] 🔄 Converted to muLaw (${muLawBuffer.length} bytes)`);
                
                const twilioResponse = {
                  event: "media",
                  streamSid: this.twilioStreamSid,
                  media: { payload: muLawBuffer.toString('base64') },
                };
                
                if (this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(JSON.stringify(twilioResponse));
                  console.log("[Handler] ✅ Audio sent back to Twilio successfully!");
                } else {
                  console.error("[Handler] ❌ Cannot send to Twilio: WebSocket is not open");
                }
              } else {
                if (!audioData) {
                  console.log("[Handler] ⚠️ No audio data in Google response");
                }
                if (!this.twilioStreamSid) {
                  console.log("[Handler] ⚠️ No Twilio streamSid available");
                }
              }
            } catch (err) {
              console.error("[Handler] ❌ Error processing Google AI response:", err);
            }
          },
          onerror: (e) => {
            console.error("[Handler] ❌ Google AI Error:", e);
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.close(1011, "An AI service error occurred.");
            }
          },
          onclose: () => {
            console.log("[Handler] 🔌 Google AI session closed.");
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.close(1000, "AI session ended.");
            }
          },
        },
      })) as MinimalLiveSession;
      
      console.log("[Handler] ✅ Google AI connection established successfully!");
    } catch (error) {
      console.error("[Handler] ❌ Failed to connect to Google AI:", error);
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1011, "Could not connect to AI service.");
      }
    }
  }

  private onClose() {
    console.log("[Handler] 🔌 Connection closed. Cleaning up.");
    console.log(`[Handler] 📊 Total audio chunks received: ${this.audioChunkCount}`);
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