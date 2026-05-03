'use server';

import { deleteChatSessionsByAgent } from '@/lib/data/chat';

export async function deleteAgentChatLogs(userId: string, agentId: string): Promise<{ success: boolean } | { error: string }> {
    if (!userId || !agentId) {
        return { error: 'User ID and Agent ID are required.' };
    }

    try {
        await deleteChatSessionsByAgent(agentId);
        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete chat logs:', e);
        return { error: e.message || 'An unknown error occurred while deleting chat logs.' };
    }
}
