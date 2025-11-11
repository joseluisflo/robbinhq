'use client';

import { useState, useRef, useEffect, type MouseEvent, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowUp,
  Paperclip,
  Mic,
  Smile,
  ImageIcon,
  Bot,
  MoreHorizontal,
  X,
  PhoneOff,
  MicOff,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SiriOrb from '@/components/smoothui/ui/SiriOrb';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { getAgentResponse } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';

interface ChatWidgetPreviewProps {
  agentData: {
    name: string;
    instructions?: string;
    temperature?: number;
    conversationStarters?: string[];
    escalationRules?: string[];
    textSources: TextSource[];
    fileSources: AgentFile[];
  };
  mode?: 'chat' | 'in-call';
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export function ChatWidgetPreview({
  agentData,
  mode = 'chat',
}: ChatWidgetPreviewProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: 'Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isResponding, startResponding] = useTransition();

  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.substring(0, 2).toUpperCase();
  };

  const handleSendMessage = () => {
    if (!prompt.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setPrompt('');

    startResponding(async () => {
      const result = await getAgentResponse({
        message: prompt,
        ...agentData
      });

      if ('error' in result) {
        toast({
          title: 'Error getting response',
          description: result.error,
          variant: 'destructive',
        });
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: 'Sorry, I encountered an error.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: result.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    });
  };

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
    <div
      className="flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: '400px', height: '650px' }}
    >
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(agentData.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">
              {agentData.name || 'Agent Preview'}
            </p>
            <p className="text-xs text-muted-foreground">
              The team can also help
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mode === 'chat' && (
        <>
          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 px-4 pt-4 bg-background flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn("max-w-[75%]", message.sender === 'user' ? 'text-right' : 'text-left')}>
                    <div className={cn("p-3 rounded-2xl", 
                      message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-muted rounded-tl-sm'
                    )}>
                      <p className="text-sm text-left">{message.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                      {message.sender === 'agent' ? agentData.name : 'You'} • {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              {isResponding && (
                <div className="flex justify-start">
                  <div className="max-w-[75%]">
                    <div className="p-3 rounded-2xl rounded-tl-sm bg-muted flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Conversation Starters */}
            {agentData.conversationStarters && agentData.conversationStarters.length > 0 && (
              <div className="pb-2 mt-4">
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
                    {agentData.conversationStarters.map((starter, index) => (
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
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t bg-card">
            <div className="relative">
              <Textarea
                placeholder="Haz una pregunta..."
                className="w-full resize-none pr-12 min-h-[52px] max-h-32 rounded-xl"
                rows={1}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isResponding}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                disabled={!prompt.trim() || isResponding}
                onClick={handleSendMessage}
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
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Bot className="h-3 w-3" /> Powered by AgentVerse
              </p>
            </div>
          </div>
        </>
      )}

      {mode === 'in-call' && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            <SiriOrb size="160px" />
          </div>
          <div className="p-4 border-t bg-card flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <MicOff className="h-6 w-6" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
