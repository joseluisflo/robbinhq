
'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Agent, Message } from '@/lib/types';
import { useUser } from '@/firebase';
import { getAgentResponse } from '@/app/actions/agents';
import { useSearchParams, useParams } from 'next/navigation';

// Define the shape of the data the hook will manage and return
export interface UseChatManagerProps {
  agent: Agent | null;
}

export function useChatManager({ agent }: UseChatManagerProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const params = useParams(); // Import and use useParams to get URL parameters

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [currentWorkflowRunId, setCurrentWorkflowRunId] = useState<string | null>(null);

  const sessionId = searchParams.get('sessionId');
  
  // Determine the correct userId. If logged in, use the current user's ID. 
  // If not (public widget), get the agent owner's ID from the URL.
  const agentOwnerUserId = user ? user.uid : (params.userId as string);

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
    // The check now uses the determined agentOwnerUserId instead of relying on a logged-in user.
    if (!messageText.trim() || !agent?.id || !agentOwnerUserId || !sessionId) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMessage]);
    
    startResponding(async () => {
      const result = await getAgentResponse({
        userId: agentOwnerUserId,
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
