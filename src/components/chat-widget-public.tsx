
'use client';

import { useState, useEffect } from 'react';
import type { Agent, Message } from '@/lib/types';
import { useChatManager } from '@/hooks/use-chat-manager';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';

interface ChatWidgetPublicProps {
  agent: Agent;
}

export function ChatWidgetPublic({ agent }: ChatWidgetPublicProps) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    if (window.self === window.top) {
      setIsWidgetOpen(true);
    } else {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'AV_WIDGET_OPEN') {
          setIsWidgetOpen(true);
        }
      };
      window.addEventListener('message', handleMessage);
      window.parent.postMessage({ type: 'AV_WIDGET_READY' }, '*');
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

  if (window.self !== window.top && !isWidgetOpen) {
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
    <div className={cn("h-full w-full flex flex-col bg-card overflow-hidden", window.self !== window.top && "rounded-2xl shadow-2xl")}>
      <ChatHeader 
        agentName={agentName}
        isDisplayNameEnabled={isDisplayNameEnabled}
        logoUrl={logoUrl}
      />
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
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
