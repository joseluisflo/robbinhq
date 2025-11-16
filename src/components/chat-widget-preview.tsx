
'use client';

import { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  X,
  Phone,
} from 'lucide-react';
import { Chat02Icon } from '@/components/lo-icons';
import type { Agent, AgentFile, TextSource, Message, Workflow } from '@/lib/types';
import { getAgentResponse } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { useUser, useFirestore, useCollection, query, collection, where } from '@/firebase';
import { selectWorkflow } from '@/ai/flows/workflow-selector';
import { runOrResumeWorkflow } from '@/app/actions/workflow';

import { ChatHeader } from './chat/ChatHeader';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { InCallView } from './chat/InCallView';


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
    orbColors?: {
        bg: string;
        c1: string;
        c2: string;
        c3: string;
    }
  };
  mode?: 'chat' | 'in-call';
}


export function ChatWidgetPreview({
  agentData,
  mode = 'chat',
}: ChatWidgetPreviewProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [currentWorkflowRunId, setCurrentWorkflowRunId] = useState<string | null>(null);

  const workflowsQuery = useMemo(() => {
    if (!user || !agentData?.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'agents', agentData.id, 'workflows'),
      where('status', '==', 'enabled')
    );
  }, [user, agentData?.id, firestore]);

  const { data: enabledWorkflows } = useCollection<Workflow>(workflowsQuery);


  const { toast } = useToast();
  
  const { 
    connectionState, 
    toggleCall, 
    liveTranscripts, 
    isThinking, 
    currentInput, 
    currentOutput 
  } = useLiveAgent(setMessages);

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
  const orbColors = agentData?.orbColors;


  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';

  useEffect(() => {
    // Set initial welcome message only if history is empty for this agent
    if (isWelcomeMessageEnabled && welcomeMessage && messages.length === 0) {
      const welcomeMsg: Message = {
        id: 'welcome-1',
        sender: 'agent',
        text: welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcomeMsg]);
    } else if (!isWelcomeMessageEnabled) {
      setMessages([]);
    }
    // Also reset workflow run ID on agent change
    setCurrentWorkflowRunId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData?.id, isWelcomeMessageEnabled, welcomeMessage]);

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;

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

      if (workflowId) {
        const workflowResult = await runOrResumeWorkflow({
          userId: user!.uid,
          agentId: agentData!.id!,
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
        const plainTextSources = textSources.map(ts => ({ title: ts.title, content: ts.content }));
        const plainFileSources = fileSources.map(fs => ({ name: fs.name, extractedText: fs.extractedText || '' }));
        
        const result = await getAgentResponse({ 
            message: messageText, 
            instructions, 
            temperature, 
            textSources: plainTextSources, 
            fileSources: plainFileSources,
        });
        
        if ('error' in result) {
            const errorMessage: Message = { id: (Date.now() + 1).toString(), sender: 'agent', text: 'Sorry, I encountered an error.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, errorMessage]);
        } else {
            const agentMessage: Message = { id: (Date.now() + 1).toString(), sender: 'agent', text: result.response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, agentMessage]);
        }
      }
    });
  };
  
  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };
  
  const handleToggleCall = () => {
    if (agentData) {
      toggleCall(agentData as Agent);
    }
  };

  return (
    <div
      className={`flex flex-col ${
        chatBubbleAlignment === 'right' ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className="flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '400px', height: '650px' }}
      >
        <ChatHeader 
          agentName={agentName}
          isDisplayNameEnabled={isDisplayNameEnabled}
          logoUrl={logoUrl}
        />

        {mode === 'chat' && (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <ChatMessages 
                messages={messages}
                liveTranscripts={liveTranscripts}
                isResponding={isResponding}
                isThinking={isThinking}
                currentInput={currentInput}
                currentOutput={currentOutput}
                isCallActive={isCallActive}
                agentName={agentName}
                isFeedbackEnabled={isFeedbackEnabled}
                themeColor={themeColor}
                onOptionClick={handleOptionClick}
            />
            <ChatInput 
                prompt={prompt}
                setPrompt={setPrompt}
                handleSendMessage={handleSendMessage}
                isResponding={isResponding}
                isCallActive={isCallActive}
                placeholder={chatInputPlaceholder}
                themeColor={themeColor}
                conversationStarters={conversationStarters}
                onToggleCall={handleToggleCall}
                isBrandingEnabled={isBrandingEnabled}
            />
          </div>
        )}

        {mode === 'in-call' && (
          <InCallView
            connectionState={connectionState}
            toggleCall={handleToggleCall}
            orbColors={orbColors}
          />
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

    