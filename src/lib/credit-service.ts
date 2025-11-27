
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { userProfile } from '@/lib/types';


/**
 * Retrieves the current credit balance for a user.
 * @param userId The ID of the user.
 * @returns The user's credit balance, or 0 if not found.
 */
export async function getUserCredits(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const firestore = firebaseAdmin.firestore();
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return 0;
    }

    const userData = userDoc.data() as userProfile;
    return userData.credits || 0;
  } catch (error) {
    console.error(`Failed to get credits for user ${userId}:`, error);
    return 0;
  }
}


/**
 * Deducts a specified amount of credits from a user's account.
 * This is an atomic operation.
 * @param userId The ID of the user.
 * @param amount The number of credits to deduct.
 * @returns An object indicating success or failure.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !amount || amount <= 0) {
    return { success: false, error: 'Invalid user ID or amount.' };
  }

  const firestore = firebaseAdmin.firestore();
  const userRef = firestore.collection('users').doc(userId);

  try {
    return await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found.');
      }

      const userData = userDoc.data() as userProfile;
      const currentCredits = userData.credits || 0;

      if (currentCredits < amount) {
        throw new Error('Insufficient credits.');
      }

      transaction.update(userRef, {
        credits: FieldValue.increment(-amount),
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error(`Failed to deduct ${amount} credits for user ${userId}:`, error);
    return { success: false, error: error.message || 'An unknown error occurred during credit deduction.' };
  }
}

/**
 * Adds a specified amount of credits to a user's account.
 * This is an atomic operation.
 * @param userId The ID of the user.
 * @param amount The number of credits to add.
 * @returns An object indicating success or failure.
 */
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
        await userRef.update({
            credits: FieldValue.increment(amount)
        });
        return { success: true };
    } catch (error: any) {
         console.error(`Failed to add ${amount} credits for user ${userId}:`, error);
        return { success: false, error: 'Failed to update user credits.' };
    }
}

    