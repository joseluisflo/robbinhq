'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SiriOrb from '@/components/smoothui/ui/SiriOrb';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface ChatWidgetPreviewProps {
    agentName: string;
    mode?: 'chat' | 'in-call';
}

const mockStarters = [
    "Dame una rutina rápida",
    "Explícame los beneficios del cardio",
    "Sugiéreme un desayuno saludable"
];


export function ChatWidgetPreview({ agentName, mode = 'chat' }: ChatWidgetPreviewProps) {
  const [prompt, setPrompt] = useState('');

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.substring(0, 2).toUpperCase();
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
            <AvatarFallback>{getInitials(agentName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{agentName || 'Agent Preview'}</p>
            <p className="text-xs text-muted-foreground">The team can also help</p>
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
          <div className="flex-1 p-6 overflow-y-auto bg-background flex flex-col justify-between">
            <div>
                <div className="flex justify-start">
                    <div className="max-w-[75%]">
                        <div className="p-3 rounded-2xl rounded-tl-sm bg-muted">
                        <p className="text-sm">
                            Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!
                        </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 ml-1">Agent • Ahora</p>
                    </div>
                </div>
            </div>
             {/* Conversation Starters */}
            <div>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-2">
                        {mockStarters.map((starter, index) => (
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
                    // Handle send
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                disabled={!prompt.trim()}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
                    <MicOff className="h-6 w-6" />
                </Button>
                 <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full">
                    <PhoneOff className="h-6 w-6" />
                </Button>
            </div>
        </>
      )}
    </div>
  );
}
