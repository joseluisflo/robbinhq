'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import type { Agent, Message, WorkflowBlock } from '@/lib/types';
import { useUser } from '@/firebase';
import { getAgentResponse } from '@/app/actions/agents';
import { useSearchParams, useParams, usePathname } from 'next/navigation';

// Define the shape of the data the hook will manage and return
export interface UseChatManagerProps {
  agent: (Partial<Agent> & { id?: string }) | null;
  // This prop is for the workflow test widget to override the workflow
  workflowOverride?: {
    workflowId: string;
    blocks: WorkflowBlock[];
  } | null;
}

export function useChatManager({ agent, workflowOverride }: UseChatManagerProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [currentWorkflowRunId, setCurrentWorkflowRunId] = useState<string | null>(null);

  const isTestWidget = workflowOverride !== undefined;
  
  const sessionId = useMemo(() => {
    // For regular widget, get from URL or generate.
    // For test widget, use a static or unique-per-session ID.
    if (isTestWidget) {
        return `test-session-${agent?.id || 'unknown'}`;
    }
    let currentSessionId = searchParams.get('sessionId');
    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      if (typeof window !== 'undefined') {
        const newUrl = `${pathname}?sessionId=${currentSessionId}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
      }
    }
    return currentSessionId;
  }, [searchParams, pathname, isTestWidget, agent?.id]);

  const userId = user ? user.uid : (params.userId as string);
  const agentId = agent?.id;
  
  // Effect to set initial welcome message
  useEffect(() => {
    if (agent) {
      const isWelcomeEnabled = agent.isWelcomeMessageEnabled ?? true;
      const welcomeMessage = agent.welcomeMessage;

      if (isWelcomeEnabled && welcomeMessage && messages.length === 0) {
        const welcomeMsg: Message = {
          id: 'welcome-1',
          sender: 'agent',
          text: welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([welcomeMsg]);
      } else if (messages.length === 0) {
        setMessages([]);
      }
      setCurrentWorkflowRunId(null);
    }
     // We only want to run this when the agent changes, not when messages array changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);


  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !agentId || !userId || !sessionId) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMessage]);
    
    startResponding(async () => {
      const result = await getAgentResponse({
        userId: userId,
        agentId: agentId,
        message: messageText,
        runId: currentWorkflowRunId,
        sessionId: sessionId,
        // Pass workflow override if it exists
        currentWorkflowId: workflowOverride?.workflowId,
        currentWorkflowBlocks: workflowOverride?.blocks
      });
      
      let agentMessage: Message | null = null;
      
      if ('error' in result) {
         agentMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: result.error,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setCurrentWorkflowRunId(null);
      } else if (result.type === 'workflow') {
        setCurrentWorkflowRunId(result.runId);
        if (result.status === 'awaiting_input' && result.promptForUser) {
          agentMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: result.promptForUser,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: result.options,
          };
        } else if (result.status === 'completed') {
          const finalResult = result.finalResult || "Workflow completed.";
          agentMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: finalResult,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setCurrentWorkflowRunId(null);
        }
      } else if (result.type === 'chat') {
         agentMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: result.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setCurrentWorkflowRunId(null);
      }
      
      if (agentMessage) {
        setMessages(prev => [...prev, agentMessage!]);
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
    userId,
    agentId,
    sessionId
  };
}
