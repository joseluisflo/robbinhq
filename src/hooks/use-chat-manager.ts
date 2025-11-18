
'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Agent, Message } from '@/lib/types';
import { useUser } from '@/firebase';
import { getAgentResponse } from '@/app/actions/agents';
import { useSearchParams } from 'next/navigation';

// Define the shape of the data the hook will manage and return
export interface UseChatManagerProps {
  agent: Agent | null;
}

export function useChatManager({ agent }: UseChatManagerProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [currentWorkflowRunId, setCurrentWorkflowRunId] = useState<string | null>(null);

  const sessionId = searchParams.get('sessionId');

  // Effect to set initial welcome message
  useEffect(() => {
    if (agent) {
      const isWelcomeEnabled = agent.isWelcomeMessageEnabled ?? true;
      const welcomeMessage = agent.welcomeMessage;

      if (isWelcomeEnabled && welcomeMessage) {
        const welcomeMsg: Message = {
          id: 'welcome-1',
          sender: 'agent',
          text: welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages([]);
      }
      setCurrentWorkflowRunId(null);
    }
  }, [agent]);

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !agent?.id || !user || !sessionId) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMessage]);
    
    startResponding(async () => {
      const result = await getAgentResponse({
        userId: user.uid,
        agentId: agent.id!,
        message: messageText,
        runId: currentWorkflowRunId,
        sessionId: sessionId,
      });

      if ('error' in result) {
         const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: result.error,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, agentMessage]);
          setCurrentWorkflowRunId(null);
      } else if (result.type === 'workflow') {
        setCurrentWorkflowRunId(result.runId);
        if (result.status === 'awaiting_input' && result.promptForUser) {
          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: result.promptForUser,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: result.options,
          };
          setMessages(prev => [...prev, agentMessage]);
        } else if (result.status === 'completed') {
          const finalResult = result.finalResult || "Workflow completed.";
          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: finalResult,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, agentMessage]);
          setCurrentWorkflowRunId(null);
        }
      } else if (result.type === 'chat') {
         const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: result.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, agentMessage]);
          setCurrentWorkflowRunId(null);
      }
    });
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  return {
    messages,
    setMessages,
    prompt,
    setPrompt,
    isResponding,
    handleSendMessage,
    handleOptionClick,
  };
}

    