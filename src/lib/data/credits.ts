import type { CreditTransaction, userProfile } from "@/lib/types";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const PLAN_CREDITS: Record<string, number> = {
  free: 150,
  essential: 2000,
  pro: 5000,
};

function getNextCreditResetDate(now = new Date()): Date {
  const nextResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);

  if (now > nextResetDate) {
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  }

  return nextResetDate;
}

function jsonOrNull(value: unknown) {
  return value === undefined || value === null ? Prisma.JsonNull : value;
}

function mapUserProfile(record: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  credits: number;
  planId: string;
  creditResetDate: Date | null;
  stripeCustomerId: string | null;
  autoRechargeEnabled: boolean | null;
  rechargeThreshold: number | null;
  rechargeAmount: number | null;
}): userProfile {
  return {
    id: record.id,
    displayName: record.name,
    email: record.email,
    photoURL: record.image ?? undefined,
    credits: record.credits,
    planId: (record.planId as userProfile["planId"]) ?? "free",
    creditResetDate: record.creditResetDate?.toISOString(),
    stripeCustomerId: record.stripeCustomerId ?? undefined,
    autoRechargeEnabled: record.autoRechargeEnabled ?? undefined,
    rechargeThreshold: record.rechargeThreshold ?? undefined,
    rechargeAmount: record.rechargeAmount ?? undefined,
  };
}

function mapCreditTransaction(record: {
  id: string;
  type: string;
  amount: number;
  description: string;
  metadata: unknown;
  createdAt: Date;
}): CreditTransaction {
  return {
    id: record.id,
    type: record.type as CreditTransaction["type"],
    amount: record.amount,
    description: record.description,
    timestamp: record.createdAt.toISOString(),
    metadata: record.metadata && record.metadata !== Prisma.JsonNull ? (record.metadata as Record<string, any>) : undefined,
  };
}

export async function resolveBillingUserId(inputUserId: string): Promise<string | null> {
  if (!inputUserId) {
    return null;
  }

  const authUser = await prisma.user.findUnique({
    where: { id: inputUserId },
    select: { id: true },
  });

  if (authUser) {
    return authUser.id;
  }

  const link = await prisma.legacyIdentityLink.findUnique({
    where: { legacyUserId: inputUserId },
    select: { authUserId: true },
  });

  return link?.authUserId ?? null;
}

export async function getUserBillingProfile(inputUserId: string): Promise<userProfile | null> {
  const userId = await resolveBillingUserId(inputUserId);
  if (!userId) {
    return null;
  }

  const record = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      credits: true,
      planId: true,
      creditResetDate: true,
      stripeCustomerId: true,
      autoRechargeEnabled: true,
      rechargeThreshold: true,
      rechargeAmount: true,
    },
  });

  return record ? mapUserProfile(record) : null;
}

export async function getUserCreditsByUserId(inputUserId: string): Promise<number> {
  const profile = await getUserBillingProfile(inputUserId);
  return profile?.credits ?? 0;
}

export async function listCreditTransactionsByUserId(
  inputUserId: string,
  limit = 50
): Promise<CreditTransaction[]> {
  const userId = await resolveBillingUserId(inputUserId);
  if (!userId) {
    return [];
  }

  const records = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map(mapCreditTransaction);
}

export async function updateUserBillingSettings(
  inputUserId: string,
  data: {
    displayName?: string;
    autoRechargeEnabled?: boolean;
    rechargeThreshold?: number;
    rechargeAmount?: number;
  }
): Promise<userProfile | null> {
  const userId = await resolveBillingUserId(inputUserId);
  if (!userId) {
    return null;
  }

  const update: Prisma.UserUpdateInput = {};
  if (data.displayName) update.name = data.displayName;
  if (data.autoRechargeEnabled !== undefined) update.autoRechargeEnabled = data.autoRechargeEnabled;
  if (data.rechargeThreshold !== undefined) update.rechargeThreshold = data.rechargeThreshold;
  if (data.rechargeAmount !== undefined) update.rechargeAmount = data.rechargeAmount;

  if (Object.keys(update).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: update,
    });
  }

  return getUserBillingProfile(userId);
}

export async function ensureStripeCustomerForUser(inputUserId: string): Promise<string | null> {
  const userId = await resolveBillingUserId(inputUserId);
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return null;
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      authUserId: user.id,
      firebaseUID: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function addCreditsByUserId(input: {
  userId: string;
  amount: number;
  description: string;
  type?: "purchase" | "deduction";
  stripePaymentIntentId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const userId = await resolveBillingUserId(input.userId);
  if (!userId || !input.amount || input.amount <= 0) {
    return { success: false, error: "Invalid user ID or amount." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (input.stripePaymentIntentId) {
        const existing = await tx.creditTransaction.findUnique({
          where: { stripePaymentIntentId: input.stripePaymentIntentId },
          select: { id: true },
        });

        if (existing) {
          return;
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: input.amount },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: input.type ?? "purchase",
          amount: input.amount,
          description: input.description,
          stripePaymentIntentId: input.stripePaymentIntentId ?? null,
          metadata: jsonOrNull(input.metadata),
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error(`[CreditData] Failed to add ${input.amount} credits for user ${input.userId}:`, error);
    return { success: false, error: error.message || "Failed to add credits." };
  }
}

export async function setUserPlanById(input: {
  userId: string;
  planId: "free" | "essential" | "pro";
  stripePaymentIntentId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const userId = await resolveBillingUserId(input.userId);
  if (!userId) {
    return { success: false, error: "Invalid user ID." };
  }

  const creditsForPlan = PLAN_CREDITS[input.planId] ?? PLAN_CREDITS.free;

  try {
    await prisma.$transaction(async (tx) => {
      if (input.stripePaymentIntentId) {
        const existing = await tx.creditTransaction.findUnique({
          where: { stripePaymentIntentId: input.stripePaymentIntentId },
          select: { id: true },
        });

        if (existing) {
          return;
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          planId: input.planId,
          credits: creditsForPlan,
          creditResetDate: getNextCreditResetDate(),
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "purchase",
          amount: creditsForPlan,
          description: `Subscribed to ${input.planId} plan`,
          stripePaymentIntentId: input.stripePaymentIntentId ?? null,
          metadata: jsonOrNull(input.metadata),
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error(`[CreditData] Failed to set plan ${input.planId} for user ${input.userId}:`, error);
    return { success: false, error: error.message || "Failed to update plan." };
  }
}

export async function deductCreditsByUserId(
  inputUserId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await resolveBillingUserId(inputUserId);

  if (!userId || amount < 0) {
    return { success: false, error: "Invalid user ID or amount." };
  }

  if (!description) {
    return { success: false, error: "Transaction description is required." };
  }

  if (amount === 0) {
    return { success: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          credits: true,
          planId: true,
          creditResetDate: true,
          stripeCustomerId: true,
          autoRechargeEnabled: true,
          rechargeThreshold: true,
          rechargeAmount: true,
        },
      });

      if (!user) {
        throw new Error("User profile not found.");
      }

      const now = new Date();
      let currentCredits = user.credits;
      let nextCreditResetDate: Date | undefined;

      if (user.creditResetDate && now > user.creditResetDate) {
        currentCredits = PLAN_CREDITS[user.planId] ?? PLAN_CREDITS.free;
        nextCreditResetDate = getNextCreditResetDate(now);
      }

      if (
        user.autoRechargeEnabled &&
        user.rechargeThreshold !== null &&
        user.rechargeAmount !== null &&
        user.stripeCustomerId &&
        currentCredits / 100 <= user.rechargeThreshold
      ) {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: "card",
        });

        const paymentMethod = paymentMethods.data[0];
        if (paymentMethod) {
          const amountToCharge = user.rechargeAmount * 100;
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amountToCharge,
            currency: "usd",
            customer: user.stripeCustomerId,
            payment_method: paymentMethod.id,
            off_session: true,
            confirm: true,
            metadata: {
              authUserId: user.id,
              firebaseUID: user.id,
              purchaseType: "auto-recharge-credits",
              creditAmount: user.rechargeAmount,
            },
          });

          currentCredits += amountToCharge;

          await tx.creditTransaction.create({
            data: {
              userId: user.id,
              type: "purchase",
              amount: amountToCharge,
              description: `Auto-recharge: ${amountToCharge} credits`,
              stripePaymentIntentId: paymentIntent.id,
              metadata: {
                source: "auto-recharge",
                stripePaymentIntentId: paymentIntent.id,
              },
            },
          });
        }
      }

      if (currentCredits < amount) {
        throw new Error("Insufficient credits to perform this action.");
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          credits: currentCredits - amount,
          creditResetDate: nextCreditResetDate,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type: "deduction",
          amount: -amount,
          description,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error(`[CreditData] Failed to deduct ${amount} credits for user ${inputUserId}:`, error);
    return { success: false, error: error.message || "Failed to deduct credits." };
  }
}
