
'use server';

import { firebaseAdmin } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { userProfile } from '@/lib/types';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');


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


async function handleAutoRecharge(
    transaction: FirebaseFirestore.Transaction,
    userRef: FirebaseFirestore.DocumentReference,
    userData: userProfile,
): Promise<number> {
    if (!userData.autoRechargeEnabled || !userData.rechargeThreshold || !userData.rechargeAmount || !userData.stripeCustomerId) {
        return userData.credits || 0;
    }

    const currentCreditsInDollars = (userData.credits || 0) / 100;
    
    if (currentCreditsInDollars <= userData.rechargeThreshold) {
        console.log(`[CreditService] 触发自动充值，用户 ${userRef.id}。余额 ${currentCreditsInDollars}$ <= 阈值 ${userData.rechargeThreshold}$`);

        const paymentMethods = await stripe.paymentMethods.list({
            customer: userData.stripeCustomerId,
            type: 'card',
        });

        const paymentMethod = paymentMethods.data[0];
        if (!paymentMethod) {
            console.warn(`[CreditService] 自动充值失败：用户 ${userRef.id} 未找到已保存的支付方式。`);
            return userData.credits || 0; 
        }

        try {
            const amountToCharge = userData.rechargeAmount * 100; // 转换为分
            
            await stripe.paymentIntents.create({
                amount: amountToCharge,
                currency: 'usd',
                customer: userData.stripeCustomerId,
                payment_method: paymentMethod.id,
                off_session: true,
                confirm: true,
                metadata: {
                    firebaseUID: userRef.id,
                    purchaseType: 'auto-recharge-credits',
                    creditAmount: userData.rechargeAmount,
                }
            });

            const creditsToAdd = userData.rechargeAmount * 100;
            transaction.update(userRef, {
                credits: FieldValue.increment(creditsToAdd)
            });

            console.log(`[CreditService] ✅ 自动充值成功：为用户 ${userRef.id} 增加了 ${creditsToAdd} 积分。`);
            return (userData.credits || 0) + creditsToAdd;

        } catch (error: any) {
            console.error(`[CreditService] ❌ Stripe 自动充值失败，用户 ${userRef.id}:`, error.message);
            // Don't throw, just log and continue. The outer transaction will handle insufficient credits.
            return userData.credits || 0;
        }
    }

    return userData.credits || 0;
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
        throw new Error('User profile not found.');
      }

      let userData = userDoc.data() as userProfile;
      let currentCredits = userData.credits ?? 0;
      const now = new Date();
      const creditResetDate = (userData.creditResetDate as Timestamp)?.toDate();
      const planId = userData.planId || 'free';

      // Check if the reset date has passed
      if (creditResetDate && now > creditResetDate) {
        const newResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);
        if (now > newResetDate) {
            newResetDate.setMonth(newResetDate.getMonth() + 1);
        }
        
        const newCredits = PLAN_CREDITS[planId];
        transaction.update(userRef, {
            credits: newCredits,
            creditResetDate: newResetDate
        });
        currentCredits = newCredits;
        userData.credits = newCredits; 
      }
      
      // Handle auto-recharge before final credit check
      currentCredits = await handleAutoRecharge(transaction, userRef, userData);

      if (currentCredits < amount) {
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
