import prisma from "@/lib/prisma";

const PLAN_CREDITS: Record<string, number> = {
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

export async function deductCreditsByUserId(
  userId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
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
        },
      });

      if (!user) {
        throw new Error("User profile not found.");
      }

      const now = new Date();
      let currentCredits = user.credits;
      const updates: { creditResetDate?: Date } = {};

      if (user.creditResetDate && now > user.creditResetDate) {
        currentCredits = PLAN_CREDITS[user.planId] ?? PLAN_CREDITS.free;
        updates.creditResetDate = getNextCreditResetDate(now);
      }

      if (currentCredits < amount) {
        throw new Error("Insufficient credits to perform this action.");
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          ...updates,
          credits: currentCredits - amount,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "deduction",
          amount: -amount,
          description,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error(`[CreditData] Failed to deduct ${amount} credits for user ${userId}:`, error);
    return { success: false, error: error.message || "Failed to deduct credits." };
  }
}
