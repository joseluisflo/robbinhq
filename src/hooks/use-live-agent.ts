
'use client';

import { useState, useCallback } from 'react';
import type { Agent, Message, ConnectionState, TextSource, AgentFile } from '@/lib/types';
import { useToast } from './use-toast';

export function useLiveAgent(setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [liveTranscripts, setLiveTranscripts] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const { toast } = useToast();

  const cleanup = useCallback(() => {
    setConnectionState('idle');
    setCurrentInput('');
    setCurrentOutput('');
    setIsThinking(false);
    setLiveTranscripts([]);
  }, []);

  const toggleCall = useCallback(async (_agent: Agent & { textSources?: TextSource[], fileSources?: AgentFile[] }) => {
    if (connectionState === 'connected') {
      cleanup();
      toast({ title: 'Call Ended' });
      return;
    }

    if (connectionState === 'connecting' || connectionState === 'closing') {
      return;
    }

    setConnectionState('error');
    setMessages((previous) => [
      ...previous,
      {
        id: `voice-security-${Date.now()}`,
        sender: 'system',
        text: 'Voice browser preview is temporarily unavailable while we secure the realtime auth flow.',
        timestamp: new Date().toISOString(),
      },
    ]);
    toast({
      title: 'Voice Preview Unavailable',
      description: 'We are moving browser voice to a server-authenticated path before turning it back on.',
      variant: 'destructive',
    });
  }, [connectionState, cleanup, toast, setMessages]);

  return { connectionState, toggleCall, liveTranscripts, isThinking, currentInput, currentOutput };
}
