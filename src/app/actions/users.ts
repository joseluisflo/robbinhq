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

export async function updateUserProfile(userId: string, data: { displayName?: string }): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !data) {
    return { error: 'User ID and data are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    const userRef = firestore.collection('users').doc(userId);

    const updateData: { [key: string]: any } = {};
    if (data.displayName) {
      updateData.displayName = data.displayName;
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'No data provided to update.' };
    }

    await userRef.update(updateData);
    
    // Note: We are not updating Firebase Auth's displayName from the server-side here.
    // That should be handled on the client to ensure the user's auth state is immediately fresh.

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update user profile in Firestore:', e);
    return { error: e.message || 'Failed to update user profile in Firestore.' };
  }
}
