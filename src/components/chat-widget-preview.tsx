
'use client';

import { useEffect, useState } from 'react';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { useChatManager } from '@/hooks/use-chat-manager';

import { ChatHeader } from './chat/ChatHeader';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { InCallView } from './chat/InCallView';
import { Button } from './ui/button';
import { Chat02Icon } from './lo-icons';

interface ChatWidgetPreviewProps {
  agent: (Partial<Agent> & {
    textSources?: TextSource[];
    fileSources?: AgentFile[];
  }) | null; // Allow agent to be null
  mode?: 'chat' | 'in-call';
}


export function ChatWidgetPreview({
  agent,
  mode = 'chat',
}: ChatWidgetPreviewProps) {
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
  
  // Gracefully handle the case where agent is not yet loaded
  if (!agent) {
    return null; // Or return a loading skeleton
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

  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';
  
  const handleToggleCall = () => {
    if (agent) {
      toggleCall(agent as Agent);
    }
  };

  useEffect(() => {
    // This effect is only relevant for the design page preview
    if (typeof window !== 'undefined' && window.self === window.top) {
        // Send config to parent window if inside an iframe
        if (window.self !== window.top) {
        window.parent.postMessage({
            type: 'AV_WIDGET_CONFIG',
            payload: {
            chatButtonColor,
            }
        }, '*');
        }
    }
  }, [chatButtonColor]);


  // This is the preview mode for the design page, which includes the bubble
  if (typeof window !== 'undefined' && window.self === window.top) {
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

            {mode === 'chat' && (
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
            )}

            {mode === 'in-call' && (
            <InCallView
                connectionState={connectionState}
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
  
  // This should not be reached if the logic in widget/[...]/page.tsx is correct.
  // The widget page itself now handles its open/closed state.
  return null;
}
