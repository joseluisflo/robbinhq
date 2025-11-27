'use server';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { firebaseAdmin } from '@/firebase/admin';
import type { userProfile } from '@/lib/types';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const PLAN_CREDITS = {
  free: 150,
  essential: 2000,
  pro: 5000,
};

async function findUserByStripeCustomerId(stripeCustomerId: string): Promise<{ userId: string; userProfile: userProfile } | null> {
    const firestore = firebaseAdmin.firestore();
    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();

    if (snapshot.empty) {
        return null;
    }

    const userDoc = snapshot.docs[0];
    return {
        userId: userDoc.id,
        userProfile: userDoc.data() as userProfile,
    };
}


export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') ?? '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const stripeCustomerId = paymentIntent.customer as string;
      const planId = paymentIntent.metadata?.planId as 'free' | 'essential' | 'pro';
      const userId = paymentIntent.metadata?.firebaseUID as string;

      if (!stripeCustomerId || !planId || !userId) {
        console.error('Webhook Error: Missing metadata from payment intent.');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      try {
        const firestore = firebaseAdmin.firestore();
        const userRef = firestore.collection('users').doc(userId);
        
        // Calculate the next credit reset date (30th of the month)
        const now = new Date();
        const nextResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);
        if (now > nextResetDate) {
          nextResetDate.setMonth(nextResetDate.getMonth() + 1);
        }

        await userRef.update({
          planId: planId,
          credits: PLAN_CREDITS[planId] || PLAN_CREDITS.free,
          creditResetDate: nextResetDate,
        });

        console.log(`✅ Successfully updated user ${userId} to plan ${planId}.`);

      } catch (error) {
        console.error('Error updating user profile in Firestore:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;
    
    case 'checkout.session.completed':
       const session = event.data.object as Stripe.Checkout.Session;
       // This event is useful for one-time checkouts. 
       // We're handling payment_intent.succeeded for more general purpose use.
       // You can add logic here if you use Stripe Checkout pages.
       console.log(`Checkout session ${session.id} completed!`);
      break;

    // TODO: Handle other events like subscription renewals or cancellations
    // case 'invoice.payment_succeeded':
    //   ...
    //   break;

    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
