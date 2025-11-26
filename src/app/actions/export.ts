
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Lead, ChatSession } from '@/lib/types';

function escapeCsvField(field: any): string {
    if (field === null || field === undefined) {
        return 'N/A';
    }
    const stringField = String(field);
    // If the field contains a comma, double quotes, or a newline, wrap it in double quotes
    if (/[",\n]/.test(stringField)) {
        // Within a double-quoted field, double quotes must be escaped by another double quote
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}


export async function exportAgentData(userId: string, agentId: string): Promise<{ csv: string } | { error: string }> {
  if (!userId || !agentId) {
    return { error: 'User ID and Agent ID are required.' };
  }

  const firestore = firebaseAdmin.firestore();
  const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);

  try {
    // 1. Fetch all leads and sessions in parallel
    const leadsPromise = agentRef.collection('leads').get();
    const sessionsPromise = agentRef.collection('sessions').get();
    
    const [leadsSnapshot, sessionsSnapshot] = await Promise.all([leadsPromise, sessionsPromise]);

    // 2. Create a map of sessions for easy lookup
    const sessionsMap = new Map<string, ChatSession>();
    sessionsSnapshot.forEach(doc => {
      sessionsMap.set(doc.id, doc.data() as ChatSession);
    });

    if (leadsSnapshot.empty) {
        return { error: "No leads available to export for this agent." };
    }

    // 3. Define CSV headers
    const headers = [
      'Lead Name', 'Lead Email', 'Lead Phone', 'Lead Summary', 'Lead Captured At',
      'Session ID', 'Session Title', 'Source', 'Session Last Activity',
      'Visitor IP', 'Visitor City', 'Visitor Country',
      'Browser', 'OS', 'Device Type'
    ];

    const csvRows: string[] = [headers.join(',')];

    // 4. Process each lead and create a CSV row
    const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));

    for (const lead of leads) {
      const session = lead.sessionId ? sessionsMap.get(lead.sessionId) : undefined;
      const createdAt = lead.createdAt as Timestamp;
      const lastActivity = session?.lastActivity as Timestamp;

      const row = [
        escapeCsvField(lead.name),
        escapeCsvField(lead.email),
        escapeCsvField(lead.phone),
        escapeCsvField(lead.summary),
        escapeCsvField(createdAt ? createdAt.toDate().toISOString() : 'N/A'),
        escapeCsvField(lead.sessionId),
        escapeCsvField(session?.title),
        'Widget', // Source is static for now
        escapeCsvField(lastActivity ? lastActivity.toDate().toISOString() : 'N/A'),
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
