'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChatSession, EmailSession, CombinedMessage } from '@/lib/types';
import { MessageList } from './MessageList';
import { SessionDetails } from './SessionDetails';
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email' };

interface ConversationViewProps {
    selectedSession: CombinedSession | null;
}

export function ConversationView({ selectedSession }: ConversationViewProps) {
    const { user } = useUser();
    const firestore = useFirestore();

    // Fetch messages here to pass to both MessageList and SessionDetails
    const messagesQuery = useMemo(() => {
        if (!user || !selectedSession) return null;
        const { type, id, agentId } = selectedSession as any;
        if (!agentId || !id) return null;
        
        const sessionTypePath = type === 'chat' ? 'sessions' : 'emailSessions';
        
        return query(
            collection(firestore, 'users', user.uid, 'agents', agentId, sessionTypePath, id, 'messages'),
            orderBy('timestamp', 'asc')
        );
    }, [user, firestore, selectedSession]);
    
    const { data: messages, loading: messagesLoading } = useCollection<CombinedMessage>(messagesQuery);


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
                   <MessageList messages={messages || []} loading={messagesLoading} />
                </TabsContent>

                <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
                    <SessionDetails session={selectedSession} messages={messages || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
