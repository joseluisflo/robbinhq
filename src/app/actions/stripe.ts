'use server';

import Stripe from 'stripe';
import { ensureStripeCustomerForUser } from '@/lib/data/credits';
import { getViewerContext } from '@/lib/auth/session';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

interface CreatePaymentIntentParams {
  amount: number;
}

export async function createPaymentIntent({
  amount,
}: CreatePaymentIntentParams): Promise<{ clientSecret: string } | { error: string }> {
  if (!amount) {
    return { error: 'Amount is required.' };
  }

  if (amount < 500) {
    return { error: 'Amount must be at least $5.00.' };
  }

  try {
    const { authUserId, legacyUserId } = await getViewerContext();
    const stripeCustomerId = await ensureStripeCustomerForUser(authUserId);

    if (!stripeCustomerId) {
      return { error: 'User not found.' };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        authUserId,
        firebaseUID: authUserId,
        legacyUserId: legacyUserId ?? '',
        purchaseType: 'credits',
        creditAmount: amount / 100,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create Payment Intent.');
    }

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (e: any) {
    console.error('Failed to create Payment Intent:', e);
    return { error: e.message || 'An unknown error occurred.' };
  }
}
