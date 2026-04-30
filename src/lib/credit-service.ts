'use server';

import {
  deductCreditsByUserId,
  getUserCreditsByUserId,
} from '@/lib/data/credits';

export async function getUserCredits(userId: string): Promise<number> {
  return getUserCreditsByUserId(userId);
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  return deductCreditsByUserId(userId, amount, description);
}
