'use server';

import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getViewerContext } from '@/lib/auth/session';
import {
  addCreditsByUserId,
  PLAN_CREDITS,
  updateUserBillingSettings,
} from '@/lib/data/credits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function getNextCreditResetDate(now = new Date()): Date {
  const nextResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);

  if (now > nextResetDate) {
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  }

  return nextResetDate;
}

export async function createUserProfile(userId: string, name: string, email: string): Promise<{ success: boolean } | { error: string }> {
  if (!userId || !name || !email) {
    return { error: 'User ID, name, and email are required.' };
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        authUserId: userId,
        firebaseUID: userId,
      },
    });

    if (!customer) {
      throw new Error('Failed to create Stripe customer.');
    }

    const initialPlanId = 'free';

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        planId: initialPlanId,
        credits: PLAN_CREDITS[initialPlanId],
        creditResetDate: getNextCreditResetDate(),
        stripeCustomerId: customer.id,
      },
    });

    await prisma.legacyIdentityLink.upsert({
      where: {
        authUserId: userId,
      },
      update: {
        legacyUserId: userId,
      },
      create: {
        authUserId: userId,
        legacyUserId: userId,
      },
    });

    return { success: true };
  } catch (e: any) {
    console.error('Failed to create user profile:', e);
    return { error: e.message || 'Failed to create user profile in database.' };
  }
}

export async function updateUserProfile(
  data: {
    displayName?: string;
    autoRechargeEnabled?: boolean;
    rechargeThreshold?: number;
    rechargeAmount?: number;
  }
): Promise<{ success: boolean } | { error: string }> {
  if (!data) {
    return { error: 'Data is required.' };
  }

  try {
    const { authUserId } = await getViewerContext();
    const nextProfile = await updateUserBillingSettings(authUserId, data);

    if (!nextProfile) {
      return { error: 'User profile not found.' };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update user profile:', e);
    return { error: e.message || 'Failed to update user profile.' };
  }
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  return addCreditsByUserId({
    userId,
    amount,
    description: `Added ${amount} credits`,
  });
}
