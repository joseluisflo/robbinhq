
'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { Shimmer } from '@/components/shimmer';

interface ChatMessagesProps {
  messages: Message[];
  liveTranscripts: Message[];
  isResponding: boolean;
  isThinking: boolean;
  currentInput: string;
  currentOutput: string;
  isCallActive: boolean;
  agentName: string;
  isFeedbackEnabled: boolean;
  themeColor: string;
  onOptionClick: (option: string) => void;
}

export function ChatMessages({
  messages,
  liveTranscripts,
  isResponding,
  isThinking,
  currentInput,
  currentOutput,
  isCallActive,
  agentName,
  isFeedbackEnabled,
  themeColor,
  onOptionClick,
}: ChatMessagesProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const displayedMessages = isCallActive ? liveTranscripts : messages;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, liveTranscripts, currentInput, currentOutput, isThinking, isResponding]);

  return (
    <div ref={chatContainerRef} className="flex-1 px-4 pt-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {displayedMessages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            agentName={agentName}
            isFeedbackEnabled={isFeedbackEnabled}
            themeColor={themeColor}
            onOptionClick={onOptionClick}
            isLastMessage={index === displayedMessages.length - 1}
            isResponding={isResponding}
          />
        ))}

        {isResponding && !isCallActive && (
          <div className="flex flex-col items-start">
            <div className="max-w-[75%]">
              <div
                className="p-3 rounded-2xl rounded-tl-sm bg-muted text-foreground"
              >
                <Shimmer as="p" className="text-sm">
                  Typing...
                </Shimmer>
              </div>
            </div>
          </div>
        )}

        {isCallActive && currentInput && (
          <div className="flex justify-end">
            <div className="max-w-[75%]">
              <div className="p-3 rounded-2xl rounded-br-sm bg-primary text-primary-foreground" style={{ backgroundColor: themeColor }}>
                <p className="text-sm text-left italic">{currentInput}</p>
              </div>
            </div>
          </div>
        )}

        {isCallActive && isThinking && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl rounded-tl-sm bg-muted flex items-center">
              <div className="flex items-center justify-center space-x-1.5 h-[20px]">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {isCallActive && currentOutput && (
          <div className="flex justify-start">
            <div className="max-w-[75%]">
              <div className="p-3 rounded-2xl rounded-tl-sm bg-muted text-foreground">
                <p className="text-sm text-left italic">{currentOutput}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

    