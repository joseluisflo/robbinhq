'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { useChatManager } from '@/hooks/use-chat-manager';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { InCallView } from '@/components/chat/InCallView';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetPage({ params }: { params: { userId: string, agentId: string } }) {
  const { userId, agentId } = params;
  const firestore = useFirestore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Communication with parent window (for widget mode)
  useEffect(() => {
    // If not in an iframe, it's a direct URL access or the iframe for embedding, so it should be "open".
    if (window.self === window.top) {
      setIsWidgetOpen(true);
    } else {
       // It's in an iframe, listen for messages from the parent
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'AV_WIDGET_OPEN') {
                setIsWidgetOpen(true);
            }
        };
        window.addEventListener('message', handleMessage);
        // Signal to parent that the widget is ready
        window.parent.postMessage({ type: 'AV_WIDGET_READY' }, '*');
        return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const { 
    messages, 
    setMessages,
    prompt,
    setPrompt,
    isResponding,
    handleSendMessage,
    handleOptionClick
  } = useChatManager({ agent });

  const { 
    connectionState, 
    toggleCall, 
    liveTranscripts, 
    isThinking, 
    currentInput, 
    currentOutput 
  } = useLiveAgent(setMessages);


  useEffect(() => {
    if (!firestore || !userId || !agentId) {
        setLoading(false);
        setError('Invalid parameters.');
        return;
    };

    const fetchAgent = async () => {
      try {
        const agentDocRef = doc(firestore, 'users', userId, 'agents', agentId);
        const agentSnap = await getDoc(agentDocRef);

        if (agentSnap.exists()) {
          const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
          
          // Also fetch subcollections for knowledge
          const textsQuery = collection(firestore, 'users', userId, 'agents', agentId, 'texts');
          const filesQuery = collection(firestore, 'users', userId, 'agents', agentId, 'files');

          const [textsSnapshot, filesSnapshot] = await Promise.all([
             getDocs(textsQuery),
             getDocs(filesQuery)
          ]);

          agentData.textSources = textsSnapshot.docs.map(d => d.data() as TextSource);
          agentData.fileSources = filesSnapshot.docs.map(d => d.data() as AgentFile);

          setAgent(agentData);

        } else {
          setError('Agent not found.');
        }
      } catch (err) {
        console.error('Error fetching agent:', err);
        setError('Failed to load agent.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [firestore, userId, agentId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
        <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>
      </div>
    );
  }
  
  if (!agent) {
    return null; // Should be covered by error state, but for safety
  }
  
  // In iframe mode, only render the chat window if it's supposed to be open
  if (window.self !== window.top && !isWidgetOpen) {
    return null;
  }

  const agentName = agent.name || 'Agent Preview';
  const conversationStarters = agent.conversationStarters || [];
  const isDisplayNameEnabled = agent.isDisplayNameEnabled ?? true;
  const logoUrl = agent.logoUrl;
  const themeColor = agent.themeColor || '#16a34a';
  const chatInputPlaceholder = agent.chatInputPlaceholder || 'Ask anything';
  const isFeedbackEnabled = agent.isFeedbackEnabled ?? true;
  const isBrandingEnabled = agent.isBrandingEnabled ?? true;
  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';

  const handleToggleCall = () => {
    if (agent) {
      toggleCall(agent as Agent);
    }
  };
  
  return (
     <div className={cn("h-full w-full flex flex-col bg-card overflow-hidden", window.self !== window.top && "rounded-2xl shadow-2xl")}>
      <ChatHeader 
        agentName={agentName}
        isDisplayNameEnabled={isDisplayNameEnabled}
        logoUrl={logoUrl}
      />
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
    </div>
  );
}
