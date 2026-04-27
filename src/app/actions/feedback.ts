'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
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
    const firestore = firebaseAdmin.firestore();
    const feedbackRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId).collection('feedback');

    const newFeedback = {
      messageId,
      sessionId,
      rating,
      comment: comment || null,
      timestamp: FieldValue.serverTimestamp(),
    };

    await feedbackRef.add(newFeedback);

    try {
      const link = await prisma.legacyIdentityLink.findUnique({
        where: { legacyUserId: userId },
        select: { authUserId: true },
      });

      if (link?.authUserId) {
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
      }
    } catch (mirrorError) {
      console.error('Failed to mirror message feedback to Postgres:', mirrorError);
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to save message feedback:', e);
    return { error: e.message || 'Failed to save feedback to the database.' };
  }
}
