
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { firebaseAdmin } from '@/firebase/admin';
import type { userProfile } from '@/lib/types';
import { headers } from 'next/headers';
import { addCredits } from '@/app/actions/users';
import { FieldValue } from 'firebase-admin/firestore';


// Force Node.js runtime to ensure Stripe webhook processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


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
      
      const userId = paymentIntent.metadata?.firebaseUID;
      const purchaseType = paymentIntent.metadata?.purchaseType;
      const creditAmount = paymentIntent.metadata?.creditAmount; // In dollars

      if (!userId) {
        console.error('Webhook Error: Missing firebaseUID in payment intent metadata.');
        return NextResponse.json({ error: 'Missing user identifier from payment intent.' }, { status: 400 });
      }

      try {
        const firestore = firebaseAdmin.firestore();
        const userRef = firestore.collection('users').doc(userId);
        const transactionCollection = userRef.collection('creditTransactions');

        if (purchaseType === 'credits' || purchaseType === 'auto-recharge-credits') {
          if (!creditAmount) {
             console.error('Webhook Error: Missing creditAmount for credits purchase.');
             return NextResponse.json({ error: 'Missing credit amount metadata.' }, { status: 400 });
          }
          // Assuming $1 = 100 credits
          const creditsToAdd = Number(creditAmount) * 100;
          await addCredits(userId, creditsToAdd);

          // Log the purchase transaction
          await transactionCollection.add({
              type: 'purchase',
              amount: creditsToAdd,
              description: purchaseType === 'auto-recharge-credits' 
                ? `Auto-recharge: ${creditsToAdd} credits`
                : `Purchase of ${creditsToAdd} credits`,
              timestamp: FieldValue.serverTimestamp(),
              metadata: { stripePaymentIntentId: paymentIntent.id }
          });
          console.log(`✅ Successfully added ${creditsToAdd} credits and logged transaction for user ${userId}.`);

        } else {
           // Handle plan upgrade logic
           const planId = paymentIntent.metadata?.planId as 'free' | 'essential' | 'pro';
            if (!planId) {
                console.error('Webhook Error: Missing planId for plan upgrade.');
                return NextResponse.json({ error: 'Missing plan ID metadata for upgrade.' }, { status: 400 });
            }
            
            const now = new Date();
            const nextResetDate = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59);
            if (now > nextResetDate) {
              nextResetDate.setMonth(nextResetDate.getMonth() + 1);
            }
            
            const creditsForPlan = PLAN_CREDITS[planId] || PLAN_CREDITS.free;
            
            await userRef.update({
              planId: planId,
              credits: creditsForPlan,
              creditResetDate: nextResetDate,
            });

            // Log the plan change transaction
            await transactionCollection.add({
                type: 'purchase',
                amount: creditsForPlan,
                description: `Subscribed to ${planId} plan`,
                timestamp: FieldValue.serverTimestamp(),
                metadata: { stripePaymentIntentId: paymentIntent.id }
            });

            console.log(`✅ Successfully updated user ${userId} to plan ${planId} and logged transaction.`);
        }

      } catch (error) {
        console.error('Error handling payment_intent.succeeded in Firestore:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;

    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
