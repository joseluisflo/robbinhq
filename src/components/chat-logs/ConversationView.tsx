'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, Globe, Monitor, Smartphone } from 'lucide-react';
import type { ChatSession, EmailSession, CombinedMessage } from '@/lib/types';
import { MessageList } from './MessageList';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email' };

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}:</p>
            <p className="font-medium text-right">{value}</p>
        </div>
    );
};

interface ConversationViewProps {
    selectedSession: CombinedSession | null;
}

export function ConversationView({ selectedSession }: ConversationViewProps) {
    if (!selectedSession) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
                <p>Select a conversation to view</p>
            </div>
        );
    }
    
    const visitorInfo = (selectedSession as ChatSession)?.visitorInfo;
    const DeviceIcon = visitorInfo?.device?.type === 'mobile' ? Smartphone : Monitor;

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
                   <MessageList session={selectedSession} />
                </TabsContent>

                <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
                    <div className="p-6 space-y-6">
                        {/* Details content remains the same */}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}