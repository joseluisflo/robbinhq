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

    return (
        <div className="p-6 space-y-6">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={cn(
                        'flex items-end gap-3',
                        msg.sender === 'user' || (typeof msg.sender === 'string' && !['agent', 'system'].includes(msg.sender)) ? 'flex-row-reverse' : 'flex-row'
                    )}
                >
                    <div
                        className={cn(
                            'max-w-[70%] rounded-lg p-3 text-sm',
                            msg.sender === 'user' || (typeof msg.sender === 'string' && !['agent', 'system'].includes(msg.sender))
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                        )}
                    >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <p
                            className={cn(
                                'text-xs mt-2 text-right',
                                msg.sender === 'user' || (typeof msg.sender === 'string' && !['agent', 'system'].includes(msg.sender))
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
