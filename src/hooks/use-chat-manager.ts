'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import type { Agent, Message, Workflow } from '@/lib/types';
import { useUser, useFirestore, useCollection, query, collection, where } from '@/firebase';
import { selectWorkflow } from '@/ai/flows/workflow-selector';
import { runOrResumeWorkflow } from '@/app/actions/workflow';
import { getAgentResponse } from '@/app/actions/agents';

// Define the shape of the data the hook will manage and return
export interface UseChatManagerProps {
  agent: Agent | null;
}

export function useChatManager({ agent }: UseChatManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [currentWorkflowRunId, setCurrentWorkflowRunId] = useState<string | null>(null);

  const agentId = agent?.id;

  // Firestore query for enabled workflows
  const workflowsQuery = useMemo(() => {
    if (!user || !agentId) return null;
    return query(
      collection(firestore, 'users', user.uid, 'agents', agentId, 'workflows'),
      where('status', '==', 'enabled')
    );
  }, [user, agentId, firestore]);

  const { data: enabledWorkflows } = useCollection<Workflow>(workflowsQuery);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !agentId || !user) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMessage]);
    
    startResponding(async () => {
      const workflows = enabledWorkflows || [];
      
      const workflowSelectorResult = await selectWorkflow({ userInput: messageText, workflows: workflows.map(w => ({ id: w.id!, triggerDescription: w.blocks?.[0]?.params.description || '' }))})
        .catch(err => {
            console.error("Workflow selector failed:", err);
            return null; // Fallback gracefully
        });

      const workflowId = workflowSelectorResult?.workflowId;

      if (workflowId && user && agentId) {
        const workflowResult = await runOrResumeWorkflow({
          userId: user.uid,
          agentId: agentId,
          workflowId: workflowId,
          runId: currentWorkflowRunId,
          userInput: messageText,
        });

        if (workflowResult && 'id' in workflowResult) {
            setCurrentWorkflowRunId(workflowResult.id);
            if (workflowResult.status === 'awaiting_input' && workflowResult.promptForUser) {
                const agentMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'agent',
                    text: workflowResult.promptForUser,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    options: workflowResult.context?.options,
                };
                setMessages(prev => [...prev, agentMessage]);
            } else if (workflowResult.status === 'completed') {
                const finalResult = workflowResult.context?.finalResult || "Workflow completed.";
                 const agentMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'agent',
                    text: finalResult,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages(prev => [...prev, agentMessage]);
                setCurrentWorkflowRunId(null);
            } else if (workflowResult.status === 'failed') {
                const errorMessage = workflowResult.context?.error || "The workflow failed to execute.";
                 const agentMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'agent',
                    text: errorMessage,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages(prev => [...prev, agentMessage]);
                setCurrentWorkflowRunId(null);
            }
        } else {
             const agentMessage: Message = { id: (Date.now() + 1).toString(), sender: 'agent', text: `Workflow error: ${(workflowResult as any).error}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
             setMessages(prev => [...prev, agentMessage]);
        }
      } else {
        // Fallback to general agent response if no workflow is matched
        const result = await getAgentResponse({ 
            agent,
        });
        
        const agentMessage: Message = { 
            id: (Date.now() + 1).toString(), 
            sender: 'agent', 
            text: 'error' in result ? result.error : result.response, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setMessages(prev => [...prev, agentMessage]);
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
