
'use client';

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
  agentData?: Partial<Agent> & {
    textSources?: TextSource[];
    fileSources?: AgentFile[];
    isDisplayNameEnabled?: boolean;
    themeColor?: string;
    chatButtonColor?: string;
    chatBubbleAlignment?: 'left' | 'right';
    isFeedbackEnabled?: boolean;
    isBrandingEnabled?: boolean;
    orbColors?: {
        bg: string;
        c1: string;
        c2: string;
        c3: string;
    }
  };
  mode?: 'chat' | 'in-call';
}


export function ChatWidgetPreview({
  agentData,
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
  } = useChatManager({ agentData });
  
  const { 
    connectionState, 
    toggleCall, 
    liveTranscripts, 
    isThinking, 
    currentInput, 
    currentOutput 
  } = useLiveAgent(setMessages);

  const agentName = agentData?.name || 'Agent Preview';
  const conversationStarters = agentData?.conversationStarters || [];
  const isDisplayNameEnabled = agentData?.isDisplayNameEnabled ?? true;
  const logoUrl = agentData?.logoUrl;
  const themeColor = agentData?.themeColor || '#16a34a';
  const chatButtonColor = agentData?.chatButtonColor || themeColor;
  const chatBubbleAlignment = agentData?.chatBubbleAlignment || 'right';
  const chatInputPlaceholder = agentData?.chatInputPlaceholder || 'Ask anything';
  const isFeedbackEnabled = agentData?.isFeedbackEnabled ?? true;
  const isBrandingEnabled = agentData?.isBrandingEnabled ?? true;
  const orbColors = agentData?.orbColors;

  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';
  
  const handleToggleCall = () => {
    if (agentData) {
      toggleCall(agentData as Agent);
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

    
