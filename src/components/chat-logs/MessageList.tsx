'use client';

import type { CombinedMessage } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
    messages: CombinedMessage[];
    loading: boolean;
}

const agentEmailDomain = process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_EMAIL_INGEST_DOMAIN || 'your-domain.com';

export function MessageList({ messages, loading }: MessageListProps) {

    if (loading) {
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

    const isUserMessage = (sender: string) => {
        if (sender === 'user') return true;
        if (typeof sender === 'string' && sender.includes(`@${agentEmailDomain}`)) return false;
        if (sender === 'agent' || sender === 'system') return false;
        return true;
    }

    return (
        <div className="p-6 space-y-6">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={cn(
                        'flex items-end gap-3',
                        isUserMessage(msg.sender) ? 'flex-row-reverse' : 'flex-row'
                    )}
                >
                    <div
                        className={cn(
                            'max-w-[70%] rounded-lg p-3 text-sm',
                           isUserMessage(msg.sender)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                        )}
                    >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <p
                            className={cn(
                                'text-xs mt-2 text-right',
                                isUserMessage(msg.sender)
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
