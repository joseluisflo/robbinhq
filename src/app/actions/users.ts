

'use server';

import { firebaseAdmin } from '@/firebase/admin';

const PLAN_CREDITS = {
  free: 150,
  essential: 2000,
  pro: 5000,
};

export async function createUserProfile(userId: string, name: string, email: string): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !name || !email) {
    return { error: 'User ID, name, and email are required.' };
  }

  try {
    const firestore = firebaseAdmin.firestore();
    
    // Calculate the next credit reset date (30th of the month)
    const now = new Date();
    const nextResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);
    
    // If it's already past the 30th of this month, set it for the next month
    if (now > nextResetDate) {
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    }
    
    const initialPlanId = 'free';
    const initialCredits = PLAN_CREDITS[initialPlanId];

    await firestore.collection('users').doc(userId).set({
        displayName: name,
        email: email,
        planId: initialPlanId,
        credits: initialCredits,
        creditResetDate: nextResetDate,
    }, { merge: true }); 

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

export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
    if (!userId || !amount || amount <= 0) {
        return { success: false, error: 'Invalid user ID or amount.' };
    }

    const firestore = firebaseAdmin.firestore();
    const userRef = firestore.collection('users').doc(userId);

    try {
        await userRef.set({
            credits: amount
        }, { merge: true });
        return { success: true };
    } catch (error: any) {
         console.error(`Failed to add ${amount} credits for user ${userId}:`, error);
        return { success: false, error: 'Failed to update user credits.' };
    }
}
