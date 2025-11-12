
'use client';

import { useState, useRef, useEffect, type MouseEvent, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowUp,
  Paperclip,
  Phone,
  Bot,
  MoreHorizontal,
  X,
  PhoneOff,
  MicOff,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Chat02Icon } from '@/components/lo-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SiriOrb from '@/components/smoothui/ui/SiriOrb';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Agent, AgentFile, TextSource, Transcript } from '@/lib/types';
import { getAgentResponse } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useLiveAgent } from '@/hooks/use-live-agent';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, startResponding] = useTransition();

  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  const { 
    connectionState, 
    toggleCall, 
    transcripts: liveTranscripts, 
    isThinking, 
    currentInput, 
    currentOutput 
  } = useLiveAgent();

  const agentName = agentData?.name || 'Agent Preview';
  const welcomeMessage = agentData?.welcomeMessage;
  const isWelcomeMessageEnabled = agentData?.isWelcomeMessageEnabled;
  const conversationStarters = agentData?.conversationStarters || [];
  const textSources = agentData?.textSources || [];
  const fileSources = agentData?.fileSources || [];
  const instructions = agentData?.instructions;
  const temperature = agentData?.temperature;
  const isDisplayNameEnabled = agentData?.isDisplayNameEnabled ?? true;
  const logoUrl = agentData?.logoUrl;
  const themeColor = agentData?.themeColor || '#16a34a';
  const chatButtonColor = agentData?.chatButtonColor || themeColor;
  const chatBubbleAlignment = agentData?.chatBubbleAlignment || 'right';
  const chatInputPlaceholder = agentData?.chatInputPlaceholder || 'Ask anything';
  const isFeedbackEnabled = agentData?.isFeedbackEnabled ?? true;
  const isBrandingEnabled = agentData?.isBrandingEnabled ?? true;

  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';

  useEffect(() => {
    // Set initial welcome message when agent data changes and not in a call
    if (mode === 'chat' && isWelcomeMessageEnabled && welcomeMessage) {
      setMessages([
        {
          id: '1',
          sender: 'agent',
          text: welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [welcomeMessage, isWelcomeMessageEnabled, agentData?.id, mode]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, liveTranscripts, currentInput, currentOutput, isThinking]);

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
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
      // Convert complex objects to plain objects before sending to the server action
      const plainTextSources = textSources.map(ts => ({ title: ts.title, content: ts.content }));
      const plainFileSources = fileSources.map(fs => ({ name: fs.name, extractedText: fs.extractedText || '' }));

      const result = await getAgentResponse({
        message: prompt,
        instructions: instructions,
        temperature: temperature,
        textSources: plainTextSources,
        fileSources: plainFileSources,
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
  
  const handleToggleCall = () => {
    if (agentData) {
      toggleCall(agentData as Agent);
    }
  };

  const renderMessages = isCallActive
    ? liveTranscripts.map(t => ({...t, id: String(t.id), text: t.text, sender: t.speaker === 'ai' ? 'agent' : t.speaker, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}))
    : messages;

  const showThinking = isCallActive && isThinking;
  const showCurrentInput = isCallActive ? currentInput : '';
  const showCurrentOutput = isCallActive ? currentOutput : '';


  return (
    <div
      className={cn(
        'flex flex-col',
        chatBubbleAlignment === 'right' ? 'items-end' : 'items-start'
      )}
    >
      <div
        className="flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '400px', height: '650px' }}
      >
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between bg-card">
          {isDisplayNameEnabled ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {logoUrl && <AvatarImage src={logoUrl} alt={agentName} />}
                <AvatarFallback>{getInitials(agentName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {agentName}
                </p>
                <p className="text-xs text-muted-foreground">
                  The team can also help
                </p>
              </div>
            </div>
          ) : <div />}
          <div className={cn("flex items-center gap-1", !isDisplayNameEnabled && "w-full justify-end")}>
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
                 {renderMessages.map((message) => (
                    <div key={message.id} className={cn("flex", message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn("max-w-[75%]", message.sender === 'user' ? 'text-right' : 'text-left')}>
                            <div
                                className={cn("p-3 rounded-2xl",
                                    message.sender === 'user'
                                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                                    : 'bg-muted rounded-tl-sm text-foreground'
                                )}
                                style={{
                                    backgroundColor: message.sender === 'user' ? themeColor : undefined
                                }}
                            >
                                <p className="text-sm text-left">{message.text}</p>
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
                    </div>
                ))}
                {isResponding && !isCallActive && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%]">
                      <div className="p-3 rounded-2xl rounded-tl-sm bg-muted flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
                 {showCurrentInput && (
                    <div className="flex justify-end">
                        <div className="max-w-[75%]">
                            <div className="p-3 rounded-2xl rounded-br-sm bg-primary text-primary-foreground" style={{ backgroundColor: themeColor }}>
                                <p className="text-sm text-left italic">{showCurrentInput}</p>
                            </div>
                        </div>
                    </div>
                 )}
                 {showThinking && (
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
                 {showCurrentOutput && (
                    <div className="flex justify-start">
                        <div className="max-w-[75%]">
                            <div className="p-3 rounded-2xl rounded-tl-sm bg-muted text-foreground">
                                <p className="text-sm text-left italic">{showCurrentOutput}</p>
                            </div>
                        </div>
                    </div>
                 )}
              </div>
              
              {/* Conversation Starters */}
              {conversationStarters && conversationStarters.length > 0 && !isCallActive && (
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
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-card">
              <div className="relative">
                <Textarea
                  placeholder={isCallActive ? 'Call in progress...' : chatInputPlaceholder}
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
                  disabled={isResponding || isCallActive}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-primary-foreground"
                  disabled={!prompt.trim() || isResponding || isCallActive}
                  onClick={handleSendMessage}
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
                    onClick={handleToggleCall}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
                {isBrandingEnabled && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Bot className="h-3 w-3" /> Powered by AgentVerse
                    </p>
                )}
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
                variant={connectionState === 'connected' ? 'destructive' : 'default'}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleToggleCall}
                disabled={connectionState === 'connecting' || connectionState === 'closing'}
              >
                {connectionState === 'connected' ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
              </Button>
            </div>
          </>
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
