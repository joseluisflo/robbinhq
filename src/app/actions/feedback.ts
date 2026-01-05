'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    return { success: true };
  } catch (e: any) {
    console.error('Failed to save message feedback:', e);
    return { error: e.message || 'Failed to save feedback to the database.' };
  }
}
