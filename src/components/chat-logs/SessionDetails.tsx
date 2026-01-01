'use client';

import type { ChatSession, EmailSession, CombinedMessage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Globe, Monitor, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email' };

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}:</p>
            <p className="font-medium text-right truncate">{String(value)}</p>
        </div>
    );
};

interface SessionDetailsProps {
    session: CombinedSession;
    messages: CombinedMessage[];
}

export function SessionDetails({ session, messages }: SessionDetailsProps) {
    const visitorInfo = (session as ChatSession)?.visitorInfo;
    const DeviceIcon = visitorInfo?.device?.type === 'mobile' ? Smartphone : Monitor;
    const createdAt = (session.createdAt as Timestamp)?.toDate();
    const lastActivity = (session.lastActivity as Timestamp)?.toDate();

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Info className="h-5 w-5" />
                        General Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <DetailRow label="Source" value={session.type === 'chat' ? 'Web Chat' : 'Email'} />
                    <DetailRow label="Total Messages" value={messages.length} />
                    <DetailRow label="Started" value={createdAt ? format(createdAt, 'PPpp') : 'N/A'} />
                    <DetailRow label="Last Activity" value={lastActivity ? format(lastActivity, 'PPpp') : 'N/A'} />
                </CardContent>
            </Card>

            {visitorInfo && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Globe className="h-5 w-5" />
                                Visitor Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <DetailRow label="IP Address" value={visitorInfo.ip} />
                            <DetailRow label="City" value={visitorInfo.location?.city} />
                            <DetailRow label="Region" value={visitorInfo.location?.region} />
                            <DetailRow label="Country" value={visitorInfo.location?.country} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DeviceIcon className="h-5 w-5" />
                                Visitor Device
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <DetailRow label="Browser" value={`${visitorInfo.browser?.name || ''} ${visitorInfo.browser?.version || ''}`.trim()} />
                            <DetailRow label="Operating System" value={`${visitorInfo.os?.name || ''} ${visitorInfo.os?.version || ''}`.trim()} />
                            <DetailRow label="Device" value={`${visitorInfo.device?.vendor || ''} ${visitorInfo.device?.model || ''}`.trim() || visitorInfo.device?.type} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
