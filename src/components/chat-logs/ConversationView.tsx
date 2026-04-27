'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChatSession, EmailSession, CombinedMessage } from '@/lib/types';
import { MessageList } from './MessageList';
import { SessionDetails } from './SessionDetails';
import { useAgentSessionMessages } from '@/hooks/use-agent-domain';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email'; agentId?: string };

interface ConversationViewProps {
    selectedSession: CombinedSession | null;
}

export function ConversationView({ selectedSession }: ConversationViewProps) {
    const { messages, loading: messagesLoading } = useAgentSessionMessages(
        selectedSession?.agentId,
        selectedSession?.id
    );


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
