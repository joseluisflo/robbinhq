'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChatSession, EmailSession, CombinedMessage, PhoneCallSession } from '@/lib/types';
import { MessageList } from './MessageList';
import { SessionDetails } from './SessionDetails';
import { useAgentEmailMessages, useAgentPhoneMessages, useAgentSessionMessages } from '@/hooks/use-agent-domain';

type CombinedSession = (ChatSession | EmailSession | PhoneCallSession) & { type: 'chat' | 'email' | 'phone'; agentId?: string };

interface ConversationViewProps {
    selectedSession: CombinedSession | null;
}

export function ConversationView({ selectedSession }: ConversationViewProps) {
    const chatMessages = useAgentSessionMessages(
        selectedSession?.type === 'chat' ? selectedSession?.agentId : undefined,
        selectedSession?.type === 'chat' ? selectedSession?.id : undefined
    );
    const emailMessages = useAgentEmailMessages(
        selectedSession?.type === 'email' ? selectedSession?.agentId : undefined,
        selectedSession?.type === 'email' ? selectedSession?.id : undefined
    );
    const phoneMessages = useAgentPhoneMessages(
        selectedSession?.type === 'phone' ? selectedSession?.agentId : undefined,
        selectedSession?.type === 'phone' ? selectedSession?.id : undefined
    );

    const messages =
        selectedSession?.type === 'email'
            ? emailMessages.messages
            : selectedSession?.type === 'phone'
                ? phoneMessages.messages
                : chatMessages.messages;
    const messagesLoading =
        selectedSession?.type === 'email'
            ? emailMessages.loading
            : selectedSession?.type === 'phone'
                ? phoneMessages.loading
                : chatMessages.loading;


    if (!selectedSession) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
                <p>Select a conversation to view</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <Tabs defaultValue="chat" className="flex flex-col h-full">
                <div className="flex-shrink-0 px-4 py-2 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chat">Conversation</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="chat" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
                   <MessageList messages={(messages || []) as CombinedMessage[]} loading={messagesLoading} />
                </TabsContent>

                <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
                    <SessionDetails session={selectedSession} messages={(messages || []) as CombinedMessage[]} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
