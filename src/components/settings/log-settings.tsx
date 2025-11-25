
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';
import { useActiveAgent } from '@/app/(main)/layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Loader2, MessageSquare, Phone, Mail, FileCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InteractionLog, LogStep, ConfigurationLog } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';

const originIcons: Record<string, React.ElementType> = {
  Chat: MessageSquare,
  Email: Mail,
  'In-Call': Phone,
  Phone: Phone,
  System: FileCog,
};

const statusInfo: Record<string, { icon: React.ElementType, color: string }> = {
    success: { icon: CheckCircle, color: 'text-green-500' },
    error: { icon: XCircle, color: 'text-red-500' },
    'in-progress': { icon: Loader2, color: 'text-blue-500' },
};


function LogSteps({ logId }: { logId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { activeAgent } = useActiveAgent();
    
    const stepsQuery = useMemo(() => {
        if (!user || !activeAgent?.id || !logId) return null;
        return query(
            collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'interactionLogs', logId, 'steps'),
            orderBy('timestamp', 'asc')
        );
    }, [user, firestore, activeAgent?.id, logId]);

    const { data: steps, loading } = useCollection<LogStep>(stepsQuery);

    if (loading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading steps...</div>;
    }

    if (!steps || steps.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground">No detailed steps for this log.</div>;
    }

    return (
        <ul className="space-y-2">
            {steps.map(step => (
                <li key={step.id} className="flex items-center justify-between">
                    <span className="truncate pr-4">{step.description}</span>
                    <span className="text-xs font-mono text-muted-foreground/80">
                        {step.timestamp ? format((step.timestamp as Timestamp).toDate(), 'HH:mm:ss.SSS') : ''}
                    </span>
                </li>
            ))}
        </ul>
    );
}


export function LogSettings() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();

  const interactionLogsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'interactionLogs'), orderBy('timestamp', 'desc'));
  }, [user, firestore, activeAgent?.id]);
  const { data: interactionLogs, loading: loadingInteractions } = useCollection<InteractionLog>(interactionLogsQuery);

  const configLogsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'configurationLogs'), orderBy('timestamp', 'desc'));
  }, [user, firestore, activeAgent?.id]);
  const { data: configLogs, loading: loadingConfig } = useCollection<ConfigurationLog>(configLogsQuery);

  const combinedLogs = useMemo(() => {
    const interactions = (interactionLogs || []).map(log => ({ ...log, logType: 'interaction' as const }));
    const configs = (configLogs || []).map(log => ({ ...log, logType: 'config' as const, origin: 'System' })); // Add origin for consistency
    
    const allLogs = [...interactions, ...configs];
    
    allLogs.sort((a, b) => {
      const timeA = (a.timestamp as Timestamp)?.toMillis() || 0;
      const timeB = (b.timestamp as Timestamp)?.toMillis() || 0;
      return timeB - timeA;
    });

    return allLogs;
  }, [interactionLogs, configLogs]);

  const loading = loadingInteractions || loadingConfig;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">Event Logs</h3>
        <p className="text-sm text-muted-foreground">
          A chronological log of important actions performed by your agent.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : combinedLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No logs found for this agent yet.</div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2">
            {combinedLogs.map((log) => {
                const OriginIcon = originIcons[log.origin] || MessageSquare;
                const StatusIcon = statusInfo[log.status || 'success']?.icon || CheckCircle;

                return (
                    <AccordionItem key={log.id} value={log.id!} className="border rounded-lg bg-card">
                        <AccordionTrigger className="p-4 hover:no-underline [&>svg]:hidden">
                        <div className="flex items-center gap-4 text-sm w-full">
                            <div className="flex items-center gap-2 w-1/3">
                                <StatusIcon className={cn("h-4 w-4", statusInfo[log.status || 'success']?.color, log.status === 'in-progress' && 'animate-spin')} />
                                <span className="font-medium truncate">{log.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground w-1/3">
                                <OriginIcon className="h-4 w-4" />
                                <span>{log.origin}</span>
                            </div>
                            <span className="text-muted-foreground ml-auto">
                                {log.timestamp ? formatDistanceToNow((log.timestamp as Timestamp).toDate(), { addSuffix: true }) : 'N/A'}
                            </span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-t">
                            <div className="p-4 text-sm text-muted-foreground">
                                {log.logType === 'interaction' ? (
                                    <LogSteps logId={log.id!} />
                                ) : (
                                    <p>{(log as ConfigurationLog).description}</p>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
      )}
    </div>
  );
}
