'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveAgent } from '@/app/(main)/layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Loader2, MessageSquare, Phone, Mail, FileCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InteractionLog, LogStep, ConfigurationLog } from '@/lib/types';
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function parseTimestamp(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function LogSteps({ agentId, logId }: { agentId: string; logId: string }) {
    const [steps, setSteps] = useState<LogStep[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchJson<{ steps: LogStep[] }>(`/api/agents/${agentId}/logs/${logId}/steps`)
            .then((data) => {
                if (!cancelled) {
                    setSteps(data.steps);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSteps([]);
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [agentId, logId]);

    if (loading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading steps...</div>;
    }

    if (!steps || steps.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground">No detailed steps for this log.</div>;
    }

    return (
        <ul className="space-y-2">
            {steps.map(step => {
                const ts = parseTimestamp(step.timestamp);
                return (
                    <li key={step.id} className="flex items-center justify-between">
                        <span className="truncate pr-4">{step.description}</span>
                        <span className="text-xs font-mono text-muted-foreground/80">
                            {ts ? format(ts, 'HH:mm:ss.SSS') : ''}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

type LogsResponse = {
    interactionLogs: InteractionLog[];
    configurationLogs: ConfigurationLog[];
};

export function LogSettings() {
  const { activeAgent } = useActiveAgent();
  const agentId = activeAgent?.id ?? null;

  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[] | null>(null);
  const [configLogs, setConfigLogs] = useState<ConfigurationLog[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!agentId) {
        setInteractionLogs([]);
        setConfigLogs([]);
        setLoading(false);
        return;
    }
    try {
        const data = await fetchJson<LogsResponse>(`/api/agents/${agentId}/logs`);
        setInteractionLogs(data.interactionLogs ?? []);
        setConfigLogs(data.configurationLogs ?? []);
    } catch (e) {
        console.error('Failed to load agent logs:', e);
        setInteractionLogs([]);
        setConfigLogs([]);
    } finally {
        setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!agentId) return;
    const handleFocus = () => { void load(); };
    const handleVisibility = () => {
        if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(() => {
        if (document.visibilityState === 'visible') void load();
    }, 5000);
    return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.clearInterval(intervalId);
    };
  }, [agentId, load]);

  const combinedLogs = useMemo(() => {
    const interactions = (interactionLogs || []).map(log => ({ ...log, logType: 'interaction' as const }));
    const configs = (configLogs || []).map(log => ({ ...log, logType: 'config' as const, origin: 'System', status: 'success' as const }));

    const allLogs: Array<(InteractionLog | ConfigurationLog) & { logType: 'interaction' | 'config'; origin: string; status?: string }> = [
      ...interactions,
      ...configs,
    ];

    allLogs.sort((a, b) => {
      const ta = parseTimestamp(a.timestamp)?.getTime() ?? 0;
      const tb = parseTimestamp(b.timestamp)?.getTime() ?? 0;
      return tb - ta;
    });

    return allLogs;
  }, [interactionLogs, configLogs]);

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
                const ts = parseTimestamp(log.timestamp);

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
                                {ts ? formatDistanceToNow(ts, { addSuffix: true }) : 'N/A'}
                            </span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-t">
                            <div className="p-4 text-sm text-muted-foreground">
                                {log.logType === 'interaction' ? (
                                    agentId ? <LogSteps agentId={agentId} logId={log.id!} /> : null
                                ) : (
                                    <p>{(log as ConfigurationLog).description}</p>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
      )}
    </div>
  );
}
