
'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, Globe, Monitor, Smartphone } from 'lucide-react';
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';
import type { ChatMessage, ChatSession, EmailSession, CombinedMessage } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
    const { user } = useUser();
    const firestore = useFirestore();

    const messagesQuery = useMemo(() => {
        if (!user || !selectedSession?.id) return null;
        const sessionTypePath = selectedSession.type === 'chat' ? 'sessions' : 'emailSessions';
        const agentId = (selectedSession as any).agentId || 'default-agent'; // Fallback agentId
        return query(
            collection(firestore, 'users', user.uid, 'agents', agentId, sessionTypePath, selectedSession.id, 'messages'),
            orderBy('timestamp', 'asc')
        );
    }, [user, firestore, selectedSession]);
    
    const { data: messages, loading: messagesLoading } = useCollection<CombinedMessage>(messagesQuery);
    
    const visitorInfo = (selectedSession as ChatSession)?.visitorInfo;
    const DeviceIcon = visitorInfo?.device?.type === 'mobile' ? Smartphone : Monitor;
    
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
                    <div className="p-6 space-y-6">
                        {messagesLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : messages && messages.length > 0 ? (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'flex items-end gap-3',
                                        msg.sender === 'user' || (typeof msg.sender === 'string' && msg.sender.includes('@')) ? 'flex-row-reverse' : 'flex-row'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[70%] rounded-lg p-3 text-sm',
                                            msg.sender === 'user' || (typeof msg.sender === 'string' && msg.sender.includes('@'))
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                        )}
                                    >
                                        <p>{msg.text}</p>
                                        <p
                                            className={cn(
                                                'text-xs mt-2',
                                                msg.sender === 'user' || (typeof msg.sender === 'string' && msg.sender.includes('@'))
                                                ? 'text-primary-foreground/70'
                                                : 'text-muted-foreground'
                                            )}
                                        >
                                            {msg.timestamp ? format((msg.timestamp as Timestamp).toDate(), 'p') : ''}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-8 text-muted-foreground">
                                <p>No messages in this session.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
                    <div className="p-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                    GENERAL DETAILS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <DetailRow label="Session ID" value={selectedSession.id || 'N/A'} />
                                <DetailRow label="Source" value={selectedSession.type === 'chat' ? 'Widget' : 'Email'} />
                                <DetailRow label="Status" value={'Ongoing'} />
                                <DetailRow label="Messages" value={messages?.length || 0} />
                                <DetailRow label="Created" value={selectedSession.createdAt ? format((selectedSession.createdAt as Timestamp).toDate(), 'MMM d, yyyy, p') : 'N/A'} />
                                <DetailRow label="Last activity" value={selectedSession.lastActivity ? formatDistanceToNow((selectedSession.lastActivity as Timestamp).toDate(), { addSuffix: true }) : 'N/A'} />
                                {selectedSession.type === 'email' && (
                                    <DetailRow label="Participants" value={(selectedSession as EmailSession).participants?.join(', ')} />
                                )}
                            </CardContent>
                        </Card>
                        {selectedSession.type === 'chat' && visitorInfo && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            VISITOR LOCATION
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <DetailRow label="IP Address" value={visitorInfo.ip} />
                                        <DetailRow label="City" value={visitorInfo.location?.city} />
                                        <DetailRow label="Country" value={visitorInfo.location?.country} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                                            VISITOR DEVICE
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <DetailRow label="Browser" value={`${visitorInfo.browser?.name || ''} ${visitorInfo.browser?.version || ''}`} />
                                        <DetailRow label="Operating System" value={`${visitorInfo.os?.name || ''} ${visitorInfo.os?.version || ''}`} />
                                        <DetailRow label="Device Type" value={visitorInfo.device?.type || 'Desktop'} />
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

