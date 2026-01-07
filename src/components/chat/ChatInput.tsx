
'use client';

import { useRef, useEffect, type MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Paperclip, Phone } from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Logo } from '../layout/logo';

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleSendMessage: (message: string) => void;
  isResponding: boolean;
  isCallActive: boolean;
  placeholder: string;
  themeColor: string;
  conversationStarters: string[];
  onToggleCall: () => void;
  isBrandingEnabled: boolean;
}

export function ChatInput({
  prompt,
  setPrompt,
  handleSendMessage,
  isResponding,
  isCallActive,
  placeholder,
  themeColor,
  conversationStarters,
  onToggleCall,
  isBrandingEnabled,
}: ChatInputProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handlePromptSubmit = () => {
    const messageToSend = prompt;
    setPrompt('');
    handleSendMessage(messageToSend);
  }

  const handleWheel = (e: WheelEvent) => {
    if (viewportRef.current) {
      e.preventDefault();
      viewportRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (viewport) {
        viewport.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - viewportRef.current.offsetLeft;
    scrollLeft.current = viewportRef.current.scrollLeft;
    viewportRef.current.style.cursor = 'grabbing';
    viewportRef.current.style.userSelect = 'none';
  };

  const onMouseLeaveOrUp = () => {
    if (!viewportRef.current) return;
    isDragging.current = false;
    viewportRef.current.style.cursor = 'grab';
    viewportRef.current.style.removeProperty('user-select');
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !viewportRef.current) return;
    e.preventDefault();
    const x = e.pageX - viewportRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; //scroll-fast
    viewportRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="p-4 border-t bg-card">
      {conversationStarters && conversationStarters.length > 0 && !isCallActive && (
        <div className="pb-2 pt-2 mt-[-10px] mb-2">
          <ScrollArea
            viewportRef={viewportRef}
            className="w-full whitespace-nowrap"
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeaveOrUp}
            onMouseUp={onMouseLeaveOrUp}
            onMouseMove={onMouseMove}
            style={{ cursor: 'grab' }}
          >
            <div className="flex w-max space-x-2">
              {conversationStarters.map((starter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="rounded-full h-8 text-sm"
                  onClick={() => setPrompt(starter)}
                >
                  {starter}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
        </div>
      )}
      <div className="relative">
        <Textarea
          placeholder={isCallActive ? 'Call in progress...' : placeholder}
          className="w-full resize-none pr-12 pl-4 py-3 min-h-[52px] max-h-32 rounded-xl flex items-center"
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handlePromptSubmit();
            }
          }}
          disabled={isResponding || isCallActive}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-primary-foreground"
          disabled={!prompt.trim() || isResponding || isCallActive}
          onClick={handlePromptSubmit}
          style={{ backgroundColor: themeColor }}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            disabled={isCallActive}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onToggleCall}
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
        {isBrandingEnabled && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Powered by <Logo width={60} height={12} alt="Robbin logo" className="grayscale" />
          </div>
        )}
      </div>
    </div>
  );
}
