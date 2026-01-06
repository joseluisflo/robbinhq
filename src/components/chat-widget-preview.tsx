'use client';

import type { Agent, AgentFile, TextSource, ConnectionState } from '@/lib/types';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { useChatManager } from '@/hooks/use-chat-manager';

import { ChatHeader } from './chat/ChatHeader';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { InCallView } from './chat/InCallView';
import { Button } from './ui/button';
import { Chat02Icon } from './lo-icons';
import { useEffect, useState } from 'react';

interface ChatWidgetPreviewProps {
  agent: (Partial<Agent> & {
    textSources?: TextSource[];
    fileSources?: AgentFile[];
  }) | null;
  mode?: 'chat' | 'in-call';
}

export function ChatWidgetPreview({
  agent,
  mode: initialMode = 'chat',
}: ChatWidgetPreviewProps) {
  const [currentMode, setCurrentMode] = useState<'chat' | 'in-call'>(initialMode);
  const [mockConnectionState, setMockConnectionState] = useState<ConnectionState>('connected');
  
  const { 
    messages, 
    setMessages,
    prompt,
    setPrompt,
    isResponding,
    handleSendMessage,
    handleOptionClick,
    userId,
    agentId,
    sessionId
  } = useChatManager({ agent });
  
  const { 
    isThinking, 
    currentInput, 
    currentOutput 
  } = useLiveAgent(setMessages);
  
  useEffect(() => {
    if (initialMode) {
      setCurrentMode(initialMode);
    }
  }, [initialMode]);


  if (!agent) {
    return null; // Or a loading skeleton
  }

  const agentName = agent.name || 'Agent Preview';
  const conversationStarters = agent.conversationStarters || [];
  const isDisplayNameEnabled = agent.isDisplayNameEnabled ?? true;
  const logoUrl = agent.logoUrl;
  const themeColor = agent.themeColor || '#16a34a';
  const chatButtonColor = agent.chatButtonColor || themeColor;
  const chatBubbleAlignment = agent.chatBubbleAlignment || 'right';
  const chatInputPlaceholder = agent.chatInputPlaceholder || 'Ask anything';
  const isFeedbackEnabled = agent.isFeedbackEnabled ?? true;
  const isBrandingEnabled = agent.isBrandingEnabled ?? true;
  const orbColors = agent.orbColors;

  const handleToggleCall = () => {
    // In preview mode, just toggle the UI without making a real call
    if (currentMode === 'chat') {
        setCurrentMode('in-call');
        setMockConnectionState('connected');
    } else {
        setCurrentMode('chat');
        setMockConnectionState('idle');
    }
  };

  return (
    <div
      className={`flex flex-col ${
        chatBubbleAlignment === 'right' ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className="flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '400px', height: '650px' }}
      >
        <ChatHeader 
          agentName={agentName}
          isDisplayNameEnabled={isDisplayNameEnabled}
          logoUrl={logoUrl}
        />

        {currentMode === 'chat' ? (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <ChatMessages 
                messages={messages}
                liveTranscripts={[]}
                isResponding={isResponding}
                isThinking={isThinking}
                currentInput={currentInput}
                currentOutput={currentOutput}
                isCallActive={false}
                agentName={agentName}
                isFeedbackEnabled={isFeedbackEnabled}
                themeColor={themeColor}
                onOptionClick={handleOptionClick}
                userId={userId || 'preview-user'}
                agentId={agentId || 'preview-agent'}
                sessionId={sessionId || 'preview-session'}
            />
            <ChatInput 
                prompt={prompt}
                setPrompt={setPrompt}
                handleSendMessage={handleSendMessage}
                isResponding={isResponding}
                isCallActive={false}
                placeholder={chatInputPlaceholder}
                themeColor={themeColor}
                conversationStarters={conversationStarters}
                onToggleCall={handleToggleCall}
                isBrandingEnabled={isBrandingEnabled}
            />
          </div>
        ) : (
          <InCallView
            connectionState={mockConnectionState}
            toggleCall={handleToggleCall}
            orbColors={orbColors}
          />
        )}
      </div>
      <Button
        size="icon"
        className="rounded-full h-14 w-14 mt-4 [&_svg]:size-8"
        style={{ backgroundColor: chatButtonColor }}
      >
        <Chat02Icon variant="filled" />
      </Button>
    </div>
  );
}
