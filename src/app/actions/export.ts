'use server';

import { listChatSessionsByAgent } from '@/lib/data/chat';
import { listLeadsByAgent } from '@/lib/data/leads';
import { requireAgentOwnerRecord } from '@/lib/permissions';
import type { ChatSession } from '@/lib/types';

function escapeCsvField(field: any): string {
    if (field === null || field === undefined) {
        return 'N/A';
    }
    const stringField = String(field);
    if (/[",\n]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

function formatDate(value: unknown): string {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toISOString();
}

export async function exportAgentData(userId: string, agentId: string): Promise<{ csv: string } | { error: string }> {
  if (!userId || !agentId) {
    return { error: 'User ID and Agent ID are required.' };
  }

  try {
    await requireAgentOwnerRecord(agentId);

    const [leads, sessions] = await Promise.all([
      listLeadsByAgent(agentId),
      listChatSessionsByAgent(agentId),
    ]);

    if (leads.length === 0) {
      return { error: 'No leads available to export for this agent.' };
    }

    const sessionsMap = new Map<string, ChatSession>();
    for (const session of sessions) {
      if (session.id) {
        sessionsMap.set(session.id, session);
      }
    }

    const headers = [
      'Lead Name', 'Lead Email', 'Lead Phone', 'Lead Summary', 'Lead Captured At',
      'Session ID', 'Session Title', 'Source', 'Session Last Activity',
      'Visitor IP', 'Visitor City', 'Visitor Country',
      'Browser', 'OS', 'Device Type'
    ];

    const csvRows: string[] = [headers.join(',')];

    for (const lead of leads) {
      const session = lead.sessionId ? sessionsMap.get(lead.sessionId) : undefined;

      const row = [
        escapeCsvField(lead.name),
        escapeCsvField(lead.email),
        escapeCsvField(lead.phone),
        escapeCsvField(lead.summary),
        escapeCsvField(formatDate(lead.createdAt)),
        escapeCsvField(lead.sessionId),
        escapeCsvField(session?.title),
        escapeCsvField(lead.source ?? 'Widget'),
        escapeCsvField(formatDate(session?.lastActivity)),
        escapeCsvField(session?.visitorInfo?.ip),
        escapeCsvField(session?.visitorInfo?.location?.city),
        escapeCsvField(session?.visitorInfo?.location?.country),
        escapeCsvField(`${session?.visitorInfo?.browser?.name || ''} ${session?.visitorInfo?.browser?.version || ''}`.trim()),
        escapeCsvField(`${session?.visitorInfo?.os?.name || ''} ${session?.visitorInfo?.os?.version || ''}`.trim()),
        escapeCsvField(session?.visitorInfo?.device?.type || 'Desktop'),
      ];
      csvRows.push(row.join(','));
    }

    return { csv: csvRows.join('\n') };

  } catch (e: any) {
    console.error('Failed to export agent data:', e);
    return { error: e.message || 'An unknown error occurred during data export.' };
  }
}
