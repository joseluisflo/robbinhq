'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import type { Agent, Transcript, ConnectionState, TextSource, AgentFile } from '@/lib/types';
import { decode, decodeAudioData, createBlob } from '@/lib/audioUtils';
import { useToast } from './use-toast';


// The LiveSession type is not officially exported, so we define a minimal
// interface based on its usage to satisfy TypeScript.
interface LiveSession {
  close(): void;
  sendRealtimeInput(request: { media: { data: string; mimeType: string; }; }): void;
}

// Inlined audio processor code. This is more robust than fetching a separate file.
const audioProcessorCode = `
class AudioRecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (!inputChannelData) {
      return true;
    }
    this.port.postMessage(inputChannelData);
    return true;
  }
}
registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
`;


export function useLiveAgent() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  const { toast } = useToast();

  const cleanup = useCallback(() => {
    workletNodeRef.current?.port.close();
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    inputAudioContextRef.current?.close().catch(console.error);
    inputAudioContextRef.current = null;
  }, []);

  const toggleCall = useCallback(async (agent: Agent & { textSources?: TextSource[], fileSources?: AgentFile[] }) => {
    if (connectionState === 'connected') {
      setConnectionState('closing');
      sessionRef.current?.close();
      cleanup();
      setConnectionState('idle');
      setTranscripts(prev => [...prev, { id: Date.now(), speaker: 'system', text: 'Call ended.' }]);
      return;
    }

    if (connectionState === 'connecting' || connectionState === 'closing') {
      return;
    }

    setConnectionState('connecting');
    setTranscripts([{ id: Date.now(), speaker: 'system', text: 'Starting call...' }]);
    setCurrentInput('');
    setCurrentOutput('');
    setIsThinking(false);
    currentInputRef.current = '';
    currentOutputRef.current = '';

    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

      if (!outputAudioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000, latencyHint: 'interactive' });
      }
      nextStartTimeRef.current = 0;

      const knowledge = [
        ...(agent.textSources || []).map(t => `Title: ${t.title}\nContent: ${t.content}`),
        ...(agent.fileSources || []).map(f => `File: ${f.name}\nContent: ${f.extractedText || ''}`)
      ].join('\n\n---\n\n');

      const systemInstruction = `
        You are a voice AI. Your goal is to be as responsive as possible. Keep answers extremely concise and to the point. Prioritize speed.
        
        Your instructions and persona are defined below.

        ### Instructions & Persona
        ${agent.instructions || 'You are a helpful assistant.'}
        
        ### Knowledge Base
        Use the following information to answer questions. This is your primary source of truth.
        ---
        ${knowledge}
        ---
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: async () => {
            setConnectionState('connected');
            setTranscripts(prev => [...prev, { id: Date.now(), speaker: 'system', text: 'Connection established.' }]);

            if (!inputAudioContextRef.current) {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              inputAudioContextRef.current = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
            }

            try {
              const audioProcessorBlob = new Blob([audioProcessorCode], { type: 'application/javascript' });
              const audioProcessorUrl = URL.createObjectURL(audioProcessorBlob);
              await inputAudioContextRef.current.audioWorklet.addModule(audioProcessorUrl);
              URL.revokeObjectURL(audioProcessorUrl);
            } catch (e) {
              console.error('Error loading audio worklet module:', e);
              toast({ title: 'Audio Error', description: 'Failed to load audio processor.', variant: 'destructive' });
              setConnectionState('error');
              cleanup();
              return;
            }

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            workletNodeRef.current = new AudioWorkletNode(inputAudioContextRef.current, 'audio-recorder-processor');

            workletNodeRef.current.port.onmessage = (event) => {
              const inputData = event.data;
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(workletNodeRef.current);
            workletNodeRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputRef.current += text;
              setCurrentInput(prev => prev + text);
            }
            if (message.serverContent?.outputTranscription) {
              setIsThinking(false);
              const text = message.serverContent.outputTranscription.text;
              currentOutputRef.current += text;
              setCurrentOutput(prev => prev + text);
            }
            if (message.serverContent?.turnComplete) {
              const finalInput = currentInputRef.current.trim();
              const finalOutput = currentOutputRef.current.trim();

              if (finalInput || finalOutput) {
                setTranscripts(prev => {
                  const newTranscripts: Transcript[] = [];
                  if (finalInput) {
                    newTranscripts.push({ id: Date.now(), speaker: 'user', text: finalInput });
                  }
                  if (finalOutput) {
                    newTranscripts.push({ id: Date.now() + 1, speaker: 'ai', text: finalOutput });
                  }
                  return [...prev, ...newTranscripts];
                });
              }

              if (finalInput && !finalOutput) {
                setIsThinking(true);
              }

              setCurrentInput('');
              setCurrentOutput('');
              currentInputRef.current = '';
              currentOutputRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              setIsThinking(false);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              const sourceNode = outputAudioContextRef.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputAudioContextRef.current.destination);

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;

              playingSourcesRef.current.add(sourceNode);
              sourceNode.onended = () => {
                playingSourcesRef.current.delete(sourceNode);
              };
            }

            if (message.serverContent?.interrupted) {
              playingSourcesRef.current.forEach(source => source.stop());
              playingSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('API Error:', e);
            toast({ title: 'Connection Error', description: 'An error occurred with the AI service.', variant: 'destructive' });
            setConnectionState('error');
            cleanup();
          },
          onclose: () => {
            setConnectionState('idle');
            cleanup();
          },
        },
      });
      sessionRef.current = await sessionPromise as LiveSession;
    } catch (error: any) {
      console.error("Failed to start call:", error);
      toast({ title: 'Failed to start call', description: error.message || 'Check permissions and API key.', variant: 'destructive' });
      setConnectionState('error');
      cleanup();
    }
  }, [connectionState, cleanup, toast]);

  return { connectionState, toggleCall, transcripts, isThinking, currentInput, currentOutput };
}
