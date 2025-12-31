
'use client';

import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { TextTypingEffect } from '@/components/ui/text-typing-effect';

interface ChatMessageProps {
  message: Message;
  agentName: string;
  isFeedbackEnabled: boolean;
  themeColor: string;
  onOptionClick: (option: string) => void;
  isLastMessage: boolean;
  isResponding: boolean;
}

export function ChatMessage({
  message,
  agentName,
  isFeedbackEnabled,
  themeColor,
  onOptionClick,
  isLastMessage,
  isResponding,
}: ChatMessageProps) {
  return (
    <div className={cn("flex flex-col", message.sender === 'user' ? 'items-end' : 'items-start')}>
      <div className={cn("max-w-[75%]", message.sender === 'user' ? 'text-right' : 'text-left')}>
        <div
          className={cn("p-3 rounded-2xl text-sm",
            message.sender === 'user'
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'bg-muted rounded-tl-sm text-foreground'
          )}
          style={{
            backgroundColor: message.sender === 'user' ? themeColor : undefined
          }}
        >
            {message.sender === 'agent' && isLastMessage && !isResponding ? (
                <TextTypingEffect per="char" preset="fade">
                  {message.text}
                </TextTypingEffect>
            ) : (
                <p className="text-left">{message.text}</p>
            )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 px-1">
          <p className="text-xs text-muted-foreground">
            {message.sender === 'agent' ? agentName : 'You'}
          </p>
          {message.sender === 'agent' && isFeedbackEnabled && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {message.sender === 'agent' && message.options && message.options.length > 0 && isLastMessage && (
        <div className="flex flex-col items-start w-full mt-2 space-y-2">
          {message.options.map((option, i) => (
            <Button
              key={i}
              variant="outline"
              className="rounded-lg h-auto py-2 text-left w-full max-w-[75%]"
              onClick={() => onOptionClick(option)}
              disabled={isResponding}
            >
              {option}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

    