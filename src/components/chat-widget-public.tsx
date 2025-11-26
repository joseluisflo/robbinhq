'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Agent, Message } from '@/lib/types';
import { useChatManager } from '@/hooks/use-chat-manager';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';


interface ChatWidgetPublicProps {
  agent: Agent;
}

export function ChatWidgetPublic({ agent }: ChatWidgetPublicProps) {
  // If we are in an iframe, we are open by default.
  // The parent window (widget.js) will be responsible for hiding/showing the iframe itself.
  const [isWidgetOpen, setIsWidgetOpen] = useState(typeof window !== 'undefined' && window.self !== window.top);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- FIX STARTS HERE ---
  // Generate a session ID if one isn't present in the URL.
  // This ensures the public iframe works standalone.
  const sessionId = useMemo(() => {
    let currentSessionId = searchParams.get('sessionId');
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      // We need to append it to the URL for useChatManager to pick it up.
      // This happens on the client-side.
      if (typeof window !== 'undefined') {
        const newUrl = `${pathname}?sessionId=${currentSessionId}`;
        // Use replace to avoid adding to browser history
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
      }
    }
    return currentSessionId;
  }, [pathname, searchParams]);
  // --- FIX ENDS HERE ---


  useEffect(() => {
    // If it's not in an iframe, it's a direct page load, so it should be "open".
    if (typeof window !== 'undefined' && window.self === window.top) {
      setIsWidgetOpen(true);
    } else {
      // If in an iframe, let the parent know it's ready.
      // This is for the bubble widget scenario.
      window.parent.postMessage({ type: 'AV_WIDGET_READY' }, '*');

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'AV_WIDGET_OPEN') {
          setIsWidgetOpen(true);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const { 
    messages, 
    setMessages,
    prompt,
    setPrompt,
    isResponding,
    handleSendMessage,
    handleOptionClick
  } = useChatManager({ agent });

  const { 
    connectionState, 
    toggleCall, 
    liveTranscripts, 
    isThinking, 
    currentInput, 
    currentOutput 
  } = useLiveAgent(setMessages);

  // If it's used in the bubble widget context, it might be initially hidden.
  // The direct iframe embed will always have this as true.
  if (!isWidgetOpen) {
    return null;
  }

  const agentName = agent.name || 'Agent Preview';
  const conversationStarters = agent.conversationStarters || [];
  const isDisplayNameEnabled = agent.isDisplayNameEnabled ?? true;
  const logoUrl = agent.logoUrl;
  const themeColor = agent.themeColor || '#16a34a';
  const chatInputPlaceholder = agent.chatInputPlaceholder || 'Ask anything';
  const isFeedbackEnabled = agent.isFeedbackEnabled ?? true;
  const isBrandingEnabled = agent.isBrandingEnabled ?? true;
  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';
  
  const handleToggleCall = () => {
    if (agent) {
      toggleCall(agent as Agent);
    }
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col bg-card overflow-hidden",
      window.self !== window.top && "rounded-2xl shadow-2xl"
    )}>
      <ChatHeader 
        agentName={agentName}
        isDisplayNameEnabled={isDisplayNameEnabled}
        logoUrl={logoUrl}
      />
      <div className="flex-1 flex flex-col bg-background overflow-hidden min-h-0">
        <ChatMessages 
          messages={messages}
          liveTranscripts={liveTranscripts}
          isResponding={isResponding}
          isThinking={isThinking}
          currentInput={currentInput}
          currentOutput={currentOutput}
          isCallActive={isCallActive}
          agentName={agentName}
          isFeedbackEnabled={isFeedbackEnabled}
          themeColor={themeColor}
          onOptionClick={handleOptionClick}
        />
        <ChatInput 
          prompt={prompt}
          setPrompt={setPrompt}
          handleSendMessage={handleSendMessage}
          isResponding={isResponding}
          isCallActive={isCallActive}
          placeholder={chatInputPlaceholder}
          themeColor={themeColor}
          conversationStarters={conversationStarters}
          onToggleCall={handleToggleCall}
          isBrandingEnabled={isBrandingEnabled}
        />
      </div>
    </div>
  );
}
