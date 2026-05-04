'use client';

import { useMemo, useEffect, useState } from 'react';
import type { ChatSession, EmailSession, MessageFeedback, PhoneCallSession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, MessageSquare, Mail, Phone, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useActiveAgent } from '@/app/(main)/layout';
import { useAgentChatSessions, useAgentEmailSessions, useAgentFeedback, useAgentPhoneSessions } from '@/hooks/use-agent-domain';

type CombinedSession = (ChatSession | EmailSession | PhoneCallSession) & { type: 'chat' | 'email' | 'phone'; agentId?: string };

function getSessionTitle(session: CombinedSession): string {
    if (session.type === 'chat') {
        return (session as ChatSession).title || 'Untitled Chat';
    }
    if (session.type === 'email') {
        return (session as EmailSession).subject || 'Untitled Email';
    }

    const phone = session as PhoneCallSession;
    return phone.fromNumber ? `Call from ${phone.fromNumber}` : 'Phone Call';
}

function getSessionSnippet(session: CombinedSession): string {
    if (session.type === 'chat') {
        return (session as ChatSession).lastMessageSnippet || '';
    }
    if (session.type === 'email') {
        return (session as EmailSession).lastMessageSnippet || '';
    }

    const phone = session as PhoneCallSession;
    return phone.transcriptSummary || phone.status || '';
}

interface ConversationListProps {
    onSessionSelect: (session: CombinedSession) => void;
    selectedSessionId: string | undefined;
}

export function ConversationList({ onSessionSelect, selectedSessionId }: ConversationListProps) {
    const { activeAgent } = useActiveAgent();
    const [searchTerm, setSearchTerm] = useState('');
    const {
        sessions: chatSessions,
        loading: chatSessionsLoading,
        error: chatSessionsError,
    } = useAgentChatSessions(activeAgent?.id);
    const {
        sessions: emailSessions,
        loading: emailSessionsLoading,
        error: emailSessionsError,
    } = useAgentEmailSessions(activeAgent?.id);
    const {
        sessions: phoneSessions,
        loading: phoneSessionsLoading,
        error: phoneSessionsError,
    } = useAgentPhoneSessions(activeAgent?.id);
    const {
        feedback: feedbacks,
        loading: feedbacksLoading,
        error: feedbackError,
    } = useAgentFeedback(activeAgent?.id);

    const feedbackBySession = useMemo(() => {
        if (!feedbacks) return {};
        return feedbacks.reduce((acc, feedback) => {
            if (!acc[feedback.sessionId]) {
                acc[feedback.sessionId] = [];
            }
            acc[feedback.sessionId].push(feedback);
            return acc;
        }, {} as Record<string, MessageFeedback[]>);
    }, [feedbacks]);

    const filteredSessions = useMemo(() => {
        if (!activeAgent?.id) return [];

        const chatsWithType: CombinedSession[] = (chatSessions || []).map(s => ({ ...s, type: 'chat', agentId: activeAgent.id }));
        const emailsWithType: CombinedSession[] = (emailSessions || []).map(s => ({ ...s, type: 'email', agentId: activeAgent.id }));
        const phonesWithType: CombinedSession[] = (phoneSessions || []).map(s => ({ ...s, type: 'phone', agentId: activeAgent.id }));

        const allSessions = [...chatsWithType, ...emailsWithType, ...phonesWithType];

        allSessions.sort((a, b) => {
            const timeA = a.lastActivity ? new Date(a.lastActivity as any).getTime() : 0;
            const timeB = b.lastActivity ? new Date(b.lastActivity as any).getTime() : 0;
            return timeB - timeA;
        });

        if (!searchTerm) {
            return allSessions;
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        return allSessions.filter(session => {
            const title = getSessionTitle(session);
            const snippet = getSessionSnippet(session);
            return title.toLowerCase().includes(lowercasedTerm) || snippet.toLowerCase().includes(lowercasedTerm);
        });

    }, [chatSessions, emailSessions, phoneSessions, activeAgent?.id, searchTerm]);

    useEffect(() => {
        if (filteredSessions.length > 0 && !selectedSessionId) {
            onSessionSelect(filteredSessions[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredSessions, selectedSessionId]);

    const getSessionFeedbackIndicator = (sessionId: string) => {
        const sessionFeedbacks = feedbackBySession[sessionId];
        if (!sessionFeedbacks || sessionFeedbacks.length === 0) return null;

        const hasPositive = sessionFeedbacks.some(f => f.rating === 'positive');
        const hasNegative = sessionFeedbacks.some(f => f.rating === 'negative');

        if (hasNegative) {
            return <div className="flex items-center justify-center h-4 w-4 rounded-full bg-red-100"><ThumbsDown className="h-2.5 w-2.5 text-red-600" /></div>;
        }
        if (hasPositive) {
            return <div className="flex items-center justify-center h-4 w-4 rounded-full bg-green-100"><ThumbsUp className="h-2.5 w-2.5 text-green-600" /></div>;
        }
        return null;
    }

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
                <Input
                    placeholder="Type to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                {(chatSessionsLoading || emailSessionsLoading || phoneSessionsLoading || feedbacksLoading) ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (chatSessionsError || emailSessionsError || phoneSessionsError || feedbackError) ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                        <AlertCircle className="h-6 w-6" />
                        <p>{chatSessionsError || emailSessionsError || phoneSessionsError || feedbackError}</p>
                    </div>
                ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
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
                                {session.type === 'chat' ? (
                                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : session.type === 'email' ? (
                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <p className="font-semibold truncate pr-4">{getSessionTitle(session)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {session.lastActivity ? formatDistanceToNow(new Date(session.lastActivity as any), { addSuffix: true }) : 'N/A'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate pl-6">
                            {getSessionSnippet(session) || '...'}
                            </p>
                            {session.id && getSessionFeedbackIndicator(session.id)}
                        </div>
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
