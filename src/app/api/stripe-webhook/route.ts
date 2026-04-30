import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  addCreditsByUserId,
  setUserPlanById,
} from '@/lib/data/credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

function getPaymentUserId(paymentIntent: Stripe.PaymentIntent) {
  return paymentIntent.metadata?.authUserId || paymentIntent.metadata?.firebaseUID || paymentIntent.metadata?.legacyUserId;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') ?? '';

  if (!webhookSecret) {
    console.error('Stripe webhook secret is not configured.');
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe webhook signature error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    console.warn(`Unhandled Stripe event type: ${event.type}`);
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = getPaymentUserId(paymentIntent);
  const purchaseType = paymentIntent.metadata?.purchaseType;

  if (!userId) {
    console.error('Stripe webhook error: missing user identifier in payment intent metadata.');
    return NextResponse.json({ error: 'Missing user identifier from payment intent.' }, { status: 400 });
  }

  try {
    if (purchaseType === 'credits' || purchaseType === 'auto-recharge-credits') {
      const creditAmount = paymentIntent.metadata?.creditAmount;
      if (!creditAmount) {
        console.error('Stripe webhook error: missing creditAmount for credits purchase.');
        return NextResponse.json({ error: 'Missing credit amount metadata.' }, { status: 400 });
      }

      const creditsToAdd = Number(creditAmount) * 100;
      const result = await addCreditsByUserId({
        userId,
        amount: creditsToAdd,
        description:
          purchaseType === 'auto-recharge-credits'
            ? `Auto-recharge: ${creditsToAdd} credits`
            : `Purchase of ${creditsToAdd} credits`,
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          source: purchaseType,
        },
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully added ${creditsToAdd} credits for user ${userId}.`);
      return NextResponse.json({ received: true });
    }

    const planId = paymentIntent.metadata?.planId as 'free' | 'essential' | 'pro' | undefined;
    if (!planId) {
      console.error('Stripe webhook error: missing planId for plan upgrade.');
      return NextResponse.json({ error: 'Missing plan ID metadata for upgrade.' }, { status: 400 });
    }

    const result = await setUserPlanById({
      userId,
      planId,
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        source: 'plan-upgrade',
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Database update failed' }, { status: 500 });
    }

    console.log(`Successfully updated user ${userId} to plan ${planId}.`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling payment_intent.succeeded in Postgres:', error);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
}
