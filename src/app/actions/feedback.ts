'use server';

import prisma from '@/lib/prisma';
import { createMessageFeedbackRecord } from '@/lib/data/chat';
import { publishChatEvent } from '@/lib/realtime/chat-events';

interface SaveFeedbackParams {
  userId: string;
  agentId: string;
  messageId: string;
  sessionId: string;
  rating: 'positive' | 'negative';
  comment?: string;
}

export async function saveMessageFeedback(params: SaveFeedbackParams): Promise<{ success: boolean } | { error: string }> {
  const { userId, agentId, messageId, sessionId, rating, comment } = params;

  if (!userId || !agentId || !messageId || !sessionId || !rating) {
    return { error: 'Missing required parameters for saving feedback.' };
  }

  try {
    const link = await prisma.legacyIdentityLink.findUnique({
      where: { legacyUserId: userId },
      select: { authUserId: true },
    });

    if (!link?.authUserId) {
      return { error: 'No linked auth user found for legacy user.' };
    }

    await createMessageFeedbackRecord({
      agentId,
      ownerUserId: link.authUserId,
      legacyOwnerId: userId,
      sessionId,
      messageId,
      rating,
      comment,
    });

    await publishChatEvent({
      type: 'feedback_created',
      agentId,
      sessionId,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Failed to save message feedback:', e);
    return { error: e.message || 'Failed to save feedback to the database.' };
  }
}
