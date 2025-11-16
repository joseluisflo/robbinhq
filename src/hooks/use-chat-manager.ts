'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import type { Agent, Message, Workflow } from '@/lib/types';
import { useUser, useFirestore, useCollection, query, collection, where } from '@/firebase';
import { selectWorkflow } from '@/ai/flows/workflow-selector';
import { runOrResumeWorkflow } from '@/app/actions/workflow';
import { getAgentResponse } from '@/app/actions/agents';

// Define the shape of the data the hook will manage and return
export interface UseChatManagerProps {
  agentData?: Partial<Agent>;
}

export function useChatManager({ agentData }: UseChatManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [currentWorkflowRunId, setCurrentWorkflowRunId] = useState<string | null>(null);

  // Firestore query for enabled workflows
  const workflowsQuery = useMemo(() => {
    if (!user || !agentData?.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'agents', agentData.id, 'workflows'),
      where('status', '==', 'enabled')
    );
  }, [user, agentData?.id, firestore]);

  const { data: enabledWorkflows } = useCollection<Workflow>(workflowsQuery);

  // Effect to set initial welcome message
  useEffect(() => {
    const isWelcomeEnabled = agentData?.isWelcomeMessageEnabled ?? true;
    const welcomeMessage = agentData?.welcomeMessage;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData?.id, agentData?.isWelcomeMessageEnabled, agentData?.welcomeMessage]);

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !agentData || !user) return;

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

      if (workflowId && user && agentData.id) {
        const workflowResult = await runOrResumeWorkflow({
          userId: user.uid,
          agentId: agentData.id,
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
        // Fallback to general agent response
        if (!agentData.id) {
            const errorMessage: Message = { 
                id: (Date.now() + 1).toString(), 
                sender: 'agent', 
                text: 'Sorry, I cannot respond without an agent context.', 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        const result = await getAgentResponse({ 
            userId: user.uid,
            agentId: agentData.id,
            message: messageText, 
            instructions: agentData.instructions, 
            temperature: agentData.temperature,
        });
        
        const agentMessage: Message = { 
            id: (Date.now() + 1).toString(), 
            sender: 'agent', 
            text: 'error' in result ? 'Sorry, I encountered an error.' : result.response, 
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
