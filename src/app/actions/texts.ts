'use server';

import { randomUUID } from 'node:crypto';
import { requireAgentOwner } from '@/lib/permissions';
import {
  createAgentTextRecord,
  deleteAgentTextRecord,
  getAgentTextById,
} from '@/lib/data/agent-texts';
import { createConfigurationLog } from '@/lib/data/logs';

async function recordConfigurationLog(
  agentId: string,
  legacyUserId: string,
  description: string,
): Promise<void> {
  await createConfigurationLog({
    agentId,
    title: 'Knowledge Base Updated',
    description,
    actor: legacyUserId,
  });
}


export async function addAgentText(
  userId: string,
  agentId: string,
  data: { title: string; content: string }
): Promise<{ id: string } | { error: string }> {
  if (!agentId || !data.title || !data.content) {
    return { error: 'Agent ID, title, and content are required.' };
  }

  try {
    const { legacyUserId } = await requireAgentOwner(agentId);
    const textId = randomUUID();

    await createAgentTextRecord({
      id: textId,
      agentId,
      title: data.title,
      content: data.content,
    });

    try {
      await recordConfigurationLog(
        agentId,
        legacyUserId,
        `Added text source: "${data.title}"`,
      );
    } catch (logError) {
      console.error('Failed to write configuration log:', logError);
    }

    return { id: textId };
  } catch (e: any) {
    console.error('Failed to add text source:', e);
    return { error: e.message || 'Failed to add text source to database.' };
  }
}

export async function deleteAgentText(
  userId: string,
  agentId: string,
  textId: string
): Promise<{ success: boolean } | { error:string }> {
  if (!agentId || !textId) {
    return { error: 'Agent ID and Text ID are required.' };
  }

  try {
    const { legacyUserId } = await requireAgentOwner(agentId);

    const existing = await getAgentTextById(agentId, textId);
    if (!existing) {
      return { error: 'Text source not found.' };
    }

    await deleteAgentTextRecord(agentId, textId);

    try {
      await recordConfigurationLog(
        agentId,
        legacyUserId,
        `Removed text source: "${existing.title}"`,
      );
    } catch (logError) {
      console.error('Failed to write configuration log:', logError);
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete text source:', e);
    return { error: e.message || 'Failed to delete text source from database.' };
  }
}
