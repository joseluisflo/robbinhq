
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAgentOwner } from '@/lib/permissions';

export async function addAgentText(
  userId: string,
  agentId: string,
  data: { title: string; content: string }
): Promise<{ id: string } | { error: string }> {
  if (!agentId || !data.title || !data.content) {
    return { error: 'Agent ID, title, and content are required.' };
  }

  try {
    const { agentRef, legacyUserId } = await requireAgentOwner(agentId);
    const textRef = agentRef.collection('texts').doc();

    const newText = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    };

    await textRef.set(newText);
    
    // Create Configuration Log
    await agentRef.collection('configurationLogs').add({
        title: 'Knowledge Base Updated',
        description: `Added text source: "${data.title}"`,
        timestamp: FieldValue.serverTimestamp(),
        actor: legacyUserId,
    });


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
  if (!agentId || !textId) {
    return { error: 'Agent ID and Text ID are required.' };
  }

  try {
    const { agentRef, legacyUserId } = await requireAgentOwner(agentId);
    const textRef = agentRef.collection('texts').doc(textId);
    
    const textDoc = await textRef.get();
    if (!textDoc.exists) {
        return { error: 'Text source not found.' };
    }
    const textTitle = textDoc.data()?.title || 'Unknown Text';

    await textRef.delete();
    
    // Create Configuration Log
    await agentRef.collection('configurationLogs').add({
        title: 'Knowledge Base Updated',
        description: `Removed text source: "${textTitle}"`,
        timestamp: FieldValue.serverTimestamp(),
        actor: legacyUserId,
    });

    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete text source:', e);
    return { error: e.message || 'Failed to delete text source from database.' };
  }
}
