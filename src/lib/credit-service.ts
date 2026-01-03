
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
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

const PLAN_CREDITS = {
  free: 150,
  essential: 2000,
  pro: 5000,
};


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
        throw new Error('User profile not found.');
      }

      let userData = userDoc.data() as userProfile;
      let currentCredits = userData.credits ?? 0;
      const now = new Date();
      const creditResetDate = (userData.creditResetDate as Timestamp)?.toDate();
      const planId = userData.planId || 'free';

      // Check if the reset date has passed
      if (creditResetDate && now > creditResetDate) {
        // Calculate the new reset date for the next month
        const newResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);
        if (now > newResetDate) {
            newResetDate.setMonth(newResetDate.getMonth() + 1);
        }
        
        const newCredits = PLAN_CREDITS[planId];
        
        // Update user data in the transaction
        transaction.update(userRef, {
            credits: newCredits,
            creditResetDate: newResetDate
        });
        
        // Use the new credit balance for the current deduction
        currentCredits = newCredits;
      }


      if (currentCredits < amount) {
        // This error message is for internal logging, not for the end-user.
        throw new Error('Insufficient credits to perform this action.');
      }

      transaction.update(userRef, {
        credits: FieldValue.increment(-amount),
      });

      console.log(`[CreditService] ✅ Successfully deducted ${amount} credits from user ${userId}.`);
      return { success: true };
    });
  } catch (error: any) {
    console.error(`[CreditService] ❌ Failed to deduct ${amount} credits for user ${userId}:`, error);
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
