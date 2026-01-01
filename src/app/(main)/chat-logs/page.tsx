
'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/chat-logs/ConversationList';
import { ConversationView } from '@/components/chat-logs/ConversationView';
import type { ChatSession, EmailSession } from '@/lib/types';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email' };

export default function ChatLogsPage() {
    const [selectedSession, setSelectedSession] = useState<CombinedSession | null>(null);

    return (
        <div className="flex h-full flex-1">
            <div className="grid h-full w-full grid-cols-[350px_1fr] overflow-hidden">
                <ConversationList 
                    onSessionSelect={setSelectedSession}
                    selectedSessionId={selectedSession?.id}
                />
                <ConversationView selectedSession={selectedSession} />
            </div>
        </div>
    );
}
