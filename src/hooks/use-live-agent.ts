
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import type { Agent, Message, ConnectionState, TextSource, AgentFile } from '@/lib/types';
import { decode, decodeAudioData, createBlob } from '@/lib/audioUtils';
import { useToast } from './use-toast';
import { getGeminiApiKey } from '@/app/actions/genai';

// The LiveSession type is not officially exported, so we define a minimal
// interface based on its usage to satisfy TypeScript.
interface LiveSession {
  close(): void;
  sendRealtimeInput(request: { media: { data: string; mimeType: string; }; } | { text: string }): void;
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


export function useLiveAgent(setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [liveTranscripts, setLiveTranscripts] = useState<Message[]>([]);
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
  const isAgentSpeakingRef = useRef(false);

  const { toast } = useToast();

  const cleanup = useCallback(() => {
    console.log("Running cleanup...");
    isAgentSpeakingRef.current = false;
    playingSourcesRef.current.forEach(source => source.stop());
    playingSourcesRef.current.clear();
    
    if (workletNodeRef.current) {
        workletNodeRef.current.port.close();
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(console.error);
        inputAudioContextRef.current = null;
    }
     if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(console.error);
      outputAudioContextRef.current = null;
    }
    
    sessionRef.current = null;
    setConnectionState('idle');
    setCurrentInput('');
    setCurrentOutput('');
    setIsThinking(false);
    currentInputRef.current = '';
    currentOutputRef.current = '';
    setLiveTranscripts([]);
  }, []);

  const toggleCall = useCallback(async (agent: Agent & { textSources?: TextSource[], fileSources?: AgentFile[] }) => {
    if (connectionState === 'connected') {
      setConnectionState('closing');
      sessionRef.current?.close(); 
      return;
    }

    if (connectionState === 'connecting' || connectionState === 'closing') {
      return;
    }

    setConnectionState('connecting');
    setLiveTranscripts([]);
    setCurrentInput('');
    setCurrentOutput('');
    setIsThinking(false);
    currentInputRef.current = '';
    currentOutputRef.current = '';
    
    const apiKeyResult = await getGeminiApiKey();
    if (apiKeyResult.error || !apiKeyResult.apiKey) {
      toast({
        title: 'Configuration Error',
        description: apiKeyResult.error || 'Gemini API key is not configured for voice calls.',
        variant: 'destructive',
      });
      setConnectionState('error');
      return;
    }
    const apiKey = apiKeyResult.apiKey;


    try {
      const ai = new GoogleGenAI({ apiKey });

      if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000, latencyHint: 'interactive' });
      }
      nextStartTimeRef.current = 0;

      const knowledge = [
        ...(agent.textSources || []).map(t => `Title: ${t.title}\\nContent: ${t.content}`),
        ...(agent.fileSources || []).map(f => `File: ${f.name}\\nContent: ${f.extractedText || ''}`)
      ].join('\\n\\n---\\n\\n');

      const systemInstruction = `
You are a voice AI. Your goal is to be as responsive as possible. Your first response to a user MUST be an immediate, short acknowledgment like "Of course, let me check that" or "Sure, one moment". Then, you will provide the full answer.
This is a real-time conversation. Keep all your answers concise and to the point. Do not use filler phrases.
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

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: { interruptions: true },
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.agentVoice || 'Zephyr' } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: async () => {
            setConnectionState('connected');
            setLiveTranscripts(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: 'Connection established.', timestamp: new Date().toISOString() }]);

            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            
            if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') {
              inputAudioContextRef.current = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
            }
            
            await inputAudioContextRef.current.resume();

            if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') {
                console.error("AudioContext could not be created or resumed.");
                toast({ title: 'Audio Error', description: 'Could not initialize audio context.', variant: 'destructive' });
                cleanup();
                return;
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
            
            if (!inputAudioContextRef.current || !streamRef.current) {
              console.error("Audio context or media stream is not available.");
              return;
            }

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            workletNodeRef.current = new AudioWorkletNode(inputAudioContextRef.current, 'audio-recorder-processor');

            workletNodeRef.current.port.onmessage = (event) => {
              if (sessionRef.current) {
                const inputData = event.data;
                const pcmBlob = createBlob(inputData);
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              }
            };

            source.connect(workletNodeRef.current);
            workletNodeRef.current.connect(inputAudioContextRef.current.destination);

            // Programmatically start the conversation
            sessionRef.current?.sendRealtimeInput({ text: "start" });
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
                 setLiveTranscripts(prev => {
                    const newTranscripts: Message[] = [];
                    if (finalInput) {
                        newTranscripts.push({ id: Date.now().toString(), sender: 'user', text: finalInput, timestamp: new Date().toISOString() });
                    }
                    if (finalOutput) {
                        newTranscripts.push({ id: (Date.now() + 1).toString(), sender: 'agent', text: finalOutput, timestamp: new Date().toISOString() });
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
              isAgentSpeakingRef.current = true;
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
                if (playingSourcesRef.current.size === 0) {
                    isAgentSpeakingRef.current = false;
                }
              };
            }

            if (message.serverContent?.interrupted) {
              playingSourcesRef.current.forEach(source => source.stop());
              playingSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              isAgentSpeakingRef.current = false;
            }
          },
          onerror: (e) => {
            console.error('API Error:', e);
            toast({ title: 'Connection Error', description: 'An error occurred with the AI service.', variant: 'destructive' });
            setConnectionState('error');
            cleanup();
          },
          onclose: () => {
            cleanup();
            toast({ title: 'Call Ended'});
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
  }, [connectionState, cleanup, toast, setMessages]);

  return { connectionState, toggleCall, liveTranscripts, isThinking, currentInput, currentOutput };
}
