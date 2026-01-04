
'use server';

import Stripe from 'stripe';
import { firebaseAdmin } from '@/firebase/admin';
import type { userProfile } from '@/lib/types';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

interface CreatePaymentIntentParams {
  userId: string;
  amount: number; // Amount in cents
  planId?: 'essential' | 'pro' | 'credits'; // Optional planId for metadata
}

/**
 * Creates a Payment Intent with Stripe.
 * This is the first step in processing a payment. It generates a client_secret
 * that the frontend uses to securely complete the payment with Stripe Elements.
 *
 * @param {CreatePaymentIntentParams} params - The user ID and the amount to be charged.
 * @returns {Promise<{ clientSecret: string } | { error: string }>} An object with the clientSecret or an error message.
 */
export async function createPaymentIntent({
  userId,
  amount,
  planId = 'credits',
}: CreatePaymentIntentParams): Promise<{ clientSecret: string } | { error: string }> {
  if (!userId || !amount) {
    return { error: 'User ID and amount are required.' };
  }
  
  if (amount < 500) { // Stripe's minimum is usually $0.50
      return { error: 'Amount must be at least $5.00.' };
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
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      // Add metadata to link the payment to the user and plan/purchase
      metadata: {
        firebaseUID: userId,
        purchaseType: planId,
        creditAmount: amount / 100, // Store amount in dollars for clarity
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
