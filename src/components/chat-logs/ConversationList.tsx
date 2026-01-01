
'use client';

import { useMemo, useEffect } from 'react';
import { useUser, useFirestore, query, collection, orderBy, useCollection } from '@/firebase';
import type { ChatSession, EmailSession } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, Mail } from 'lucide-react';
import { useActiveAgent } from '@/app/(main)/layout';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email'; agentId?: string };

interface ConversationListProps {
    onSessionSelect: (session: CombinedSession) => void;
    selectedSessionId: string | undefined;
}

export function ConversationList({ onSessionSelect, selectedSessionId }: ConversationListProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { activeAgent } = useActiveAgent();

    const sessionsQuery = useMemo(() => {
        if (!user || !activeAgent?.id) return null;
        return query(
            collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions'),
            orderBy('lastActivity', 'desc')
        );
    }, [user, firestore, activeAgent?.id]);
    const { data: chatSessions, loading: chatSessionsLoading } = useCollection<ChatSession>(sessionsQuery);

    const emailSessionsQuery = useMemo(() => {
        if (!user || !activeAgent?.id) return null;
        return query(
            collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'emailSessions'),
            orderBy('lastActivity', 'desc')
        );
    }, [user, firestore, activeAgent?.id]);
    const { data: emailSessions, loading: emailSessionsLoading } = useCollection<EmailSession>(emailSessionsQuery);
    
    const combinedSessions = useMemo(() => {
        if (!activeAgent?.id) return [];
        
        const chatsWithType: CombinedSession[] = (chatSessions || []).map(s => ({ ...s, type: 'chat', agentId: activeAgent.id }));
        const emailsWithType: CombinedSession[] = (emailSessions || []).map(s => ({ ...s, type: 'email', agentId: activeAgent.id }));
        
        const allSessions = [...chatsWithType, ...emailsWithType];
        
        allSessions.sort((a, b) => {
            const timeA = (a.lastActivity as Timestamp)?.toDate() || 0;
            const timeB = (b.lastActivity as Timestamp)?.toDate() || 0;
            return (timeB as any) - (timeA as any);
        });
        
        return allSessions;
    }, [chatSessions, emailSessions, activeAgent?.id]);

    useEffect(() => {
        if (combinedSessions.length > 0 && !selectedSessionId) {
            onSessionSelect(combinedSessions[0]);
        }
    }, [combinedSessions, selectedSessionId, onSessionSelect]);

    return (
        <div className="flex flex-col border-r bg-card text-card-foreground overflow-hidden">
            <div className="flex-shrink-0 p-4 space-y-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Logs</h2>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="unreads" className="text-sm">
                            Unreads
                        </Label>
                        <Switch id="unreads" />
                    </div>
                </div>
                <Input placeholder="Type to search..." />
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {(chatSessionsLoading || emailSessionsLoading) ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : combinedSessions.length > 0 ? (
                    combinedSessions.map((session) => (
                    <button
                        key={`${session.type}-${session.id}`}
                        onClick={() => onSessionSelect(session)}
                        className={cn(
                        'block w-full text-left p-4 border-b hover:bg-accent',
                        selectedSessionId === session.id && 'bg-accent'
                        )}
                    >
                        <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 overflow-hidden">
                                {session.type === 'chat' ? <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" /> : <Mail className="h-4 w-4 text-muted-foreground shrink-0" />}
                                <p className="font-semibold truncate pr-4">{(session as ChatSession).title || (session as EmailSession).subject}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {session.lastActivity ? formatDistanceToNow((session.lastActivity as Timestamp).toDate(), { addSuffix: true }) : 'N/A'}
                        </p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate pl-6">
                        {(session as ChatSession).lastMessageSnippet || '...'}
                        </p>
                    </button>
                    ))
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <p>No conversation logs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
