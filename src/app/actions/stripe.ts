
'use server';

import Stripe from 'stripe';
import { firebaseAdmin } from '@/firebase/admin';
import type { userProfile } from '@/lib/types';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Define plan prices in cents
const PLAN_PRICES = {
  essential: 1500, // $15.00
  pro: 2900, // $29.00
};

interface CreatePaymentIntentParams {
  userId: string;
  planId: 'essential' | 'pro';
}

/**
 * Creates a Payment Intent with Stripe.
 * This is the first step in processing a payment. It generates a client_secret
 * that the frontend uses to securely complete the payment with Stripe Elements.
 *
 * @param {CreatePaymentIntentParams} params - The user ID and the ID of the plan they wish to purchase.
 * @returns {Promise<{ clientSecret: string } | { error: string }>} An object with the clientSecret or an error message.
 */
export async function createPaymentIntent({
  userId,
  planId,
}: CreatePaymentIntentParams): Promise<{ clientSecret: string } | { error: string }> {
  if (!userId || !planId) {
    return { error: 'User ID and Plan ID are required.' };
  }

  if (planId !== 'essential' && planId !== 'pro') {
    return { error: 'Invalid plan ID provided.' };
  }

  const firestore = firebaseAdmin.firestore();
  const userRef = firestore.collection('users').doc(userId);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return { error: 'User not found.' };
    }

    const userData = userDoc.data() as userProfile;
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      return { error: 'Stripe customer ID not found for this user.' };
    }
    
    const amount = PLAN_PRICES[planId];

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      // Add metadata to link the payment to the user and plan
      metadata: {
        firebaseUID: userId,
        planId: planId,
      }
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
