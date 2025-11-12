'use client';

import { useState, useRef, useCallback, useEffect, useTransition } from 'react';
import type { Transcript, ConnectionState } from '@/lib/types';
import { connectLiveAgent } from '@/app/actions/live-agent';
import { useToast } from './use-toast';

// The LiveSession type is not officially exported from genkit, so we define a minimal
// interface based on its usage to satisfy TypeScript.
interface LiveSession {
  close(): void;
  send(request: {
    input: {
      audio: {
        data: string;
      };
    };
  }): void;
}

// Inlined audio processor code. This is more robust than fetching a separate file.
const audioProcessorCode = `
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (inputChannelData) {
      this.port.postMessage(inputChannelData.buffer);
    }
    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

export function useLiveAgent() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, startProcessing] = useTransition();

  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const nextStartTimeRef = useRef(0);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    console.log('Cleaning up resources...');
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    workletNodeRef.current?.port.close();
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    setIsAgentSpeaking(false);
    setIsThinking(false);
  }, []);

  const connectMicrophone = useCallback(async (audioContext: AudioContext) => {
    if (!audioContext) return;

    try {
      if (!streamRef.current) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const audioProcessorBlob = new Blob([audioProcessorCode], { type: 'application/javascript' });
      const audioProcessorUrl = URL.createObjectURL(audioProcessorBlob);

      try {
        await audioContext.audioWorklet.addModule(audioProcessorUrl);
      } finally {
        URL.revokeObjectURL(audioProcessorUrl);
      }

      const source = audioContext.createMediaStreamSource(streamRef.current);
      workletNodeRef.current = new AudioWorkletNode(audioContext, 'audio-processor');

      workletNodeRef.current.port.onmessage = (event) => {
        const pcm16Data = new Int16Array(event.data);
        const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(pcm16Data.buffer) as any));
        sessionRef.current?.send({ input: { audio: { data: base64Data } } });
      };

      source.connect(workletNodeRef.current);
      workletNodeRef.current.connect(audioContext.destination);

    } catch (err) {
      console.error('Error connecting microphone:', err);
      toast({
        title: 'Microphone Error',
        description: 'Could not access the microphone. Please check your permissions.',
        variant: 'destructive',
      });
      cleanup();
      setConnectionState('error');
    }
  }, [cleanup, toast]);


  const processAudioQueue = useCallback(() => {
    if (isAgentSpeaking || audioQueueRef.current.length === 0 || !audioContextRef.current) {
      return;
    }

    startProcessing(() => {
      setIsAgentSpeaking(true);

      const context = audioContextRef.current!;
      const source = context.createBufferSource();
      const audioBuffer = audioQueueRef.current.shift()!;
      source.buffer = audioBuffer;
      source.connect(context.destination);

      const now = context.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      
      const duration = audioBuffer.duration;
      nextStartTimeRef.current = startTime + duration;

      source.onended = () => {
        setIsAgentSpeaking(false);
      };
    });
  }, [isAgentSpeaking]);

  useEffect(() => {
    if (!isAgentSpeaking && audioQueueRef.current.length > 0) {
      processAudioQueue();
    }
  }, [isAgentSpeaking, processAudioQueue]);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'agentResponse' && data.payload) {
        setIsThinking(false);
        const audioData = atob(data.payload);
        const- `uint8Array` = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          uint8Array[i] = audioData.charCodeAt(i);
        }
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
            const audioBuffer = await audioContextRef.current.decodeAudioData(uint8Array.buffer);
            audioQueueRef.current.push(audioBuffer);
            processAudioQueue();
        }
      } else if (data.type === 'transcript' && data.payload) {
        setIsThinking(false);
        const { text, final, speaker } = data.payload;
        setTranscripts(prev => {
          const newTranscripts = [...prev];
          const lastTranscript = newTranscripts[newTranscripts.length - 1];

          if (lastTranscript && lastTranscript.speaker === speaker && !lastTranscript.final) {
            lastTranscript.text = text;
            lastTranscript.final = final;
          } else {
            newTranscripts.push({ speaker, text, final, id: Date.now() });
          }
          return newTranscripts;
        });
      } else if (data.type === 'thinking') {
        setIsThinking(true);
      } else if (data.type === 'error' && data.payload) {
        console.error('WebSocket Error:', data.payload);
        setConnectionState('error');
      }
    } catch(e) {
      console.error('Error processing WebSocket message:', e);
    }
  }, [processAudioQueue]);


  const toggleCall = useCallback(async (agent: any) => {
    if (connectionState === 'connected') {
      cleanup();
      setConnectionState('idle');
      return;
    }

    if (connectionState === 'connecting' || connectionState === 'closing') {
      return;
    }

    setConnectionState('connecting');
    setTranscripts([]);

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtor();
    }
    
    // Resume audio context if it's suspended (required by browser policies)
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    try {
      const response = await connectLiveAgent({
        agent,
        audioFormat: {
          encoding: 'LINEAR16',
          sampleRate: audioContextRef.current.sampleRate,
        }
      });

      if ('error' in response) {
        throw new Error(response.error);
      }
      
      const { webSocketUrl } = response;
      const ws = new WebSocket(webSocketUrl);
      ws.onopen = () => {
        setConnectionState('connected');
        connectMicrophone(audioContextRef.current);
      };
      ws.onmessage = handleWebSocketMessage;
      ws.onclose = () => {
        if (connectionState !== 'error') {
            setConnectionState('idle');
        }
        cleanup();
      };
      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setConnectionState('error');
        cleanup();
      };
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnectionState('error');
      cleanup();
    }
  }, [connectionState, cleanup, connectMicrophone, handleWebSocketMessage]);

  return { connectionState, toggleCall, transcripts, isThinking };
}
