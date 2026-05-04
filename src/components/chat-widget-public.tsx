'use client';

import { useState, useEffect } from 'react';
import type { Agent, Message, WorkflowBlock } from '@/lib/types';
import { useChatManager } from '@/hooks/use-chat-manager';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { InCallView } from '@/components/chat/InCallView';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';


interface ChatWidgetPublicProps {
  agent: Agent;
  workflowOverride?: {
    workflowId: string;
    blocks: WorkflowBlock[];
  } | null;
}

export function ChatWidgetPublic({ agent, workflowOverride }: ChatWidgetPublicProps) {
  // If we are in an iframe, we are open by default.
  // The parent window (widget.js) will be responsible for hiding/showing the iframe itself.
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'chat' | 'in-call'>('chat');
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [historyResolved, setHistoryResolved] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const cookieName = 'robbin_visitor_id';
    const existingCookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${cookieName}=`))
      ?.split('=')[1];

    const nextVisitorId = existingCookie || uuidv4();
    if (!existingCookie) {
      document.cookie = `${cookieName}=${nextVisitorId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }

    setVisitorId(nextVisitorId);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !agent.id || !visitorId) {
      return;
    }

    let cancelled = false;

    const resolveSession = async () => {
      try {
        setHistoryResolved(false);
        const currentSearchParams = new URLSearchParams(window.location.search);
        const requestedSessionId = currentSearchParams.get('sessionId');
        const params = new URLSearchParams({ visitorId });
        if (requestedSessionId) {
          params.set('sessionId', requestedSessionId);
        }

        const response = await fetch(`/api/public/agents/${agent.id}/session?${params.toString()}`, {
          cache: 'no-store',
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to resolve visitor session.');
        }

        if (cancelled) {
          return;
        }

        const nextSessionId = payload?.sessionId || requestedSessionId || `session-${Date.now()}`;
        setResolvedSessionId(nextSessionId);
        setInitialMessages(Array.isArray(payload?.messages) ? payload.messages : []);

        const latestSearchParams = new URLSearchParams(window.location.search);
        const currentUrlSessionId = latestSearchParams.get('sessionId');
        if (currentUrlSessionId !== nextSessionId) {
          const newUrl = `${window.location.pathname}?sessionId=${nextSessionId}`;
          window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to bootstrap public widget session:', error);
        const latestSearchParams = new URLSearchParams(window.location.search);
        const fallbackSessionId = latestSearchParams.get('sessionId') || `session-${Date.now()}`;
        setResolvedSessionId(fallbackSessionId);
        setInitialMessages([]);

        const currentUrlSessionId = latestSearchParams.get('sessionId');
        if (currentUrlSessionId !== fallbackSessionId) {
          const newUrl = `${window.location.pathname}?sessionId=${fallbackSessionId}`;
          window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
      } finally {
        if (!cancelled) {
          setHistoryResolved(true);
        }
      }
    };

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, [agent.id, visitorId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    if (!embedded) {
      setIsWidgetOpen(true);
      return;
    }

    setIsWidgetOpen(true);
    window.parent.postMessage({ type: 'AV_WIDGET_READY' }, '*');

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AV_WIDGET_OPEN') {
        setIsWidgetOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const {
    messages,
    setMessages,
    prompt,
    setPrompt,
    isResponding,
    handleSendMessage,
    handleOptionClick,
    userId,
    agentId,
    sessionId,
  } = useChatManager({
    agent,
    workflowOverride,
    sessionIdOverride: resolvedSessionId,
    initialMessages,
    historyResolved,
    visitorId,
  });

  const {
    connectionState,
    toggleCall,
    liveTranscripts,
    isThinking,
    currentInput,
    currentOutput
  } = useLiveAgent(setMessages);

  const isCallActive = connectionState !== 'idle' && connectionState !== 'error';

  useEffect(() => {
    if (isCallActive) {
      setCurrentMode('in-call');
    } else {
      setCurrentMode('chat');
    }
  }, [isCallActive]);


  if (!isWidgetOpen) {
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
  const orbColors = agent.orbColors;

  const handleToggleCall = () => {
    if (agent) {
      toggleCall(agent as Agent);
    }
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col bg-card overflow-hidden",
      isEmbedded && "rounded-2xl shadow-2xl"
    )}>
      <ChatHeader
        agentName={agentName}
        isDisplayNameEnabled={isDisplayNameEnabled}
        logoUrl={logoUrl}
      />

      {currentMode === 'chat' && (
        <div className="flex-1 flex flex-col bg-background overflow-hidden min-h-0">
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
            userId={userId || 'public-user'}
            agentId={agentId || 'public-agent'}
            sessionId={sessionId || 'public-session'}
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

      {currentMode === 'in-call' && (
        <InCallView
            connectionState={connectionState}
            toggleCall={handleToggleCall}
            orbColors={orbColors}
        />
      )}
    </div>
  );
}
