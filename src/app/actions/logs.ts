'use server';

import { requireAgentOwnerRecord } from '@/lib/permissions';
import { softDeleteChatSessionsByAgent } from '@/lib/data/chat';
import { softDeleteEmailSessionsByAgent } from '@/lib/data/email';
import { softDeletePhoneCallSessionsByAgent } from '@/lib/data/phone-calls';

export async function deleteAgentChatLogs(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!agentId) {
        return { error: 'Agent ID is required.' };
    }

    try {
        await requireAgentOwnerRecord(agentId);
        await Promise.all([
            softDeleteChatSessionsByAgent(agentId),
            softDeleteEmailSessionsByAgent(agentId),
            softDeletePhoneCallSessionsByAgent(agentId),
        ]);

        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete chat logs:', e);
        return { error: e.message || 'An unknown error occurred while deleting chat logs.' };
    }
}
