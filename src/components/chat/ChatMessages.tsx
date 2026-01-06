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
  userId: string;
  agentId: string;
  sessionId: string;
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
  userId,
  agentId,
  sessionId,
}: ChatMessagesProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Always use `messages` for the chat view.
  // The `liveTranscripts` are handled by `useLiveAgent` and will be appended to `messages` when a turn completes.
  const displayedMessages = messages;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatContainerRef} className="flex-1 px-4 pt-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {displayedMessages.map((message, index) => (
          <ChatMessage
            key={message.id || `msg-${index}`}
            message={message}
            agentName={agentName}
            isFeedbackEnabled={isFeedbackEnabled}
            themeColor={themeColor}
            onOptionClick={onOptionClick}
            isLastMessage={index === displayedMessages.length - 1}
            isResponding={isResponding}
            userId={userId}
            agentId={agentId}
            sessionId={sessionId}
          />
        ))}

        {isResponding && (
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
      </div>
    </div>
  );
}
