'use server';

import { firebaseAdmin } from '@/firebase/admin';

export async function createUserProfile(userId: string, name: string, email: string): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !name || !email) {
    return { error: 'User ID, name, and email are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    await firestore.collection('users').doc(userId).set({
        displayName: name,
        email: email,
    }, { merge: true }); // Use merge to avoid overwriting agents subcollection if it somehow gets created first.

    return { success: true };
  } catch (e: any) {
    console.error('Failed to create user profile:', e);
    return { error: e.message || 'Failed to create user profile in database.' };
  }
}
