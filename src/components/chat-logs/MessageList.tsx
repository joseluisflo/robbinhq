'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';
import type { ChatSession, EmailSession, CombinedMessage } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email' };

interface MessageListProps {
    session: CombinedSession;
}

export function MessageList({ session }: MessageListProps) {
    const { user } = useUser();
    const firestore = useFirestore();

    const messagesQuery = useMemo(() => {
        if (!user || !session.id) return null;
        const agentId = (session as any).agentId; 
        if (!agentId) return null;

        const sessionTypePath = session.type === 'chat' ? 'sessions' : 'emailSessions';
        
        return query(
            collection(firestore, 'users', user.uid, 'agents', agentId, sessionTypePath, session.id, 'messages'),
            orderBy('timestamp', 'asc')
        );
    }, [user, firestore, session]);
    
    const { data: messages, loading: messagesLoading } = useCollection<CombinedMessage>(messagesQuery);

    if (messagesLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (!messages || messages.length === 0) {
        return (
             <div className="text-center p-8 text-muted-foreground">
                <p>No messages in this session.</p>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {messages.map((msg, index) => (
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
            ))}
        </div>
    );
}