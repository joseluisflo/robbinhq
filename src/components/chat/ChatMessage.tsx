'use client';

import { useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { TextTypingEffect } from '@/components/ui/text-typing-effect';
import { motion } from 'motion/react';
import { saveMessageFeedback } from '@/app/actions/feedback';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: Message;
  agentName: string;
  isFeedbackEnabled: boolean;
  themeColor: string;
  onOptionClick: (option: string) => void;
  isLastMessage: boolean;
  isResponding: boolean;
  userId: string;
  agentId: string;
  sessionId: string;
}

export function ChatMessage({
  message,
  agentName,
  isFeedbackEnabled,
  themeColor,
  onOptionClick,
  isLastMessage,
  isResponding,
  userId,
  agentId,
  sessionId,
}: ChatMessageProps) {
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'positive' | 'negative' | null>(null);
  const { toast } = useToast();

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    if (feedbackSent) return;

    setFeedbackSent(true);
    setSelectedFeedback(rating);

    const result = await saveMessageFeedback({
      userId,
      agentId,
      sessionId,
      messageId: message.id!,
      rating,
    });
    
    if (result.error) {
        toast({ title: 'Feedback Error', description: 'Could not save your feedback.', variant: 'destructive'});
        // Optionally revert UI state on error
        setFeedbackSent(false);
        setSelectedFeedback(null);
    } else {
        toast({ title: 'Feedback received!', description: 'Thanks for helping us improve.' });
    }
  };


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
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-4 w-4 text-muted-foreground hover:text-foreground",
                    selectedFeedback === 'positive' && 'text-green-500 hover:text-green-500'
                )}
                onClick={() => handleFeedback('positive')}
                disabled={feedbackSent}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-4 w-4 text-muted-foreground hover:text-foreground",
                    selectedFeedback === 'negative' && 'text-red-500 hover:text-red-500'
                )}
                onClick={() => handleFeedback('negative')}
                disabled={feedbackSent}
              >
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
