'use client';

import type { ChatSession, EmailSession, CombinedMessage, PhoneCallSession } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Globe, Monitor, Phone, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

type CombinedSession = (ChatSession | EmailSession | PhoneCallSession) & { type: 'chat' | 'email' | 'phone' };

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
        try {
            return (value as { toDate: () => Date }).toDate();
        } catch {
            return null;
        }
    }
    return null;
}

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
    const phoneSession = session.type === 'phone' ? (session as PhoneCallSession) : null;
    const DeviceIcon = visitorInfo?.device?.type === 'mobile' ? Smartphone : Monitor;
    const createdAt = toDate(session.createdAt);
    const lastActivity = toDate(session.lastActivity);

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
                    <DetailRow label="Source" value={session.type === 'chat' ? 'Web Chat' : session.type === 'email' ? 'Email' : 'Phone'} />
                    <DetailRow label="Total Messages" value={messages.length} />
                    <DetailRow label="Started" value={createdAt ? format(createdAt, 'PPpp') : 'N/A'} />
                    <DetailRow label="Last Activity" value={lastActivity ? format(lastActivity, 'PPpp') : 'N/A'} />
                </CardContent>
            </Card>

            {phoneSession && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Phone className="h-5 w-5" />
                            Phone Call
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Status" value={phoneSession.status} />
                        <DetailRow label="From" value={phoneSession.fromNumber} />
                        <DetailRow label="To" value={phoneSession.toNumber} />
                        <DetailRow label="Twilio Call SID" value={phoneSession.twilioCallSid} />
                    </CardContent>
                </Card>
            )}

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
