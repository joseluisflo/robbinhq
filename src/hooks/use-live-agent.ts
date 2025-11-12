'use client';

import { useState, useRef, useCallback, useEffect, useTransition } from 'react';
import type { Transcript, ConnectionState } from '@/lib/types';
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

export function useLiveAgent() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  const cleanup = useCallback(() => {
    // Implementation to follow in the next steps
  }, []);

  const toggleCall = useCallback(async (agent: any) => {
    // Implementation to follow in the next steps
  }, []);

  return { connectionState, toggleCall, transcripts, isThinking };
}
