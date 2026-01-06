
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export type EmbedType = 'chat-widget' | 'iframe';

export function useDeployChat() {
  const { activeAgent } = useActiveAgent();
  const { user } = useUser();
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');
  const [snippet, setSnippet] = useState('');
  const [embedType, setEmbedType] = useState<EmbedType>('chat-widget');

  useEffect(() => {
    // This ensures window is defined, as it's only available on the client
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (!baseUrl || !activeAgent || !user) {
      setSnippet('');
      return;
    }

    if (embedType === 'chat-widget') {
      const script = `<script src="${baseUrl}/widget.js" data-user-id="${user.uid}" data-agent-id="${activeAgent.id}" defer></script>`;
      setSnippet(script);
    } else {
      const iframeSrc = `${baseUrl}/widget/${user.uid}/${activeAgent.id}`;
      const iframeTag = `<iframe\n  src="${iframeSrc}"\n  width="400"\n  height="600"\n  allow="microphone *; autoplay *"\n  style="border:none; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"\n></iframe>`;
      setSnippet(iframeTag);
    }
  }, [baseUrl, activeAgent, user, embedType]);

  const handleCopy = useCallback(() => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    toast({
      title: 'Copied to clipboard!',
      description: "You can now paste the code into your website's HTML.",
    });
  }, [snippet, toast]);

  return {
    snippet,
    embedType,
    setEmbedType: (value: EmbedType) => setEmbedType(value),
    handleCopy,
  };
}
