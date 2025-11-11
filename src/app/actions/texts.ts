'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function addAgentText(
  userId: string,
  agentId: string,
  data: { title: string; content: string }
): Promise<{ id: string } | { error: string }> {
  if (!userId || !agentId || !data.title || !data.content) {
    return { error: 'User ID, Agent ID, title, and content are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    const textRef = firestore
      .collection('users')
      .doc(userId)
      .collection('agents')
      .doc(agentId)
      .collection('texts')
      .doc();

    const newText = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    };

    await textRef.set(newText);

    return { id: textRef.id };
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
  if (!userId || !agentId || !textId) {
    return { error: 'User ID, Agent ID, and Text ID are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    const textRef = firestore
      .collection('users')
      .doc(userId)
      .collection('agents')
      .doc(agentId)
      .collection('texts')
      .doc(textId);
    
    await textRef.delete();

    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete text source:', e);
    return { error: e.message || 'Failed to delete text source from database.' };
  }
}
