
"use client";

import { StoreIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

interface CheckoutFormProps {
    onGoBack: () => void;
    plan: {
        id: string;
        name: string;
        price: number;
    };
    setPaymentStatus: (status: string) => void;
    setStep: (step: number) => void;
}

export function CheckoutForm({ onGoBack, plan, setPaymentStatus, setStep }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const priceString = (plan.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We don't need a return_url as we will handle the result on this page.
      },
      redirect: 'if_required', 
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
      setPaymentStatus('error');
    } else {
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded');
      } else {
        setPaymentStatus(paymentIntent?.status || 'error');
      }
    }
    
    setStep(3); // Move to the status step regardless of outcome
    setIsLoading(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm and pay</DialogTitle>
        <DialogDescription>
          You are about to purchase {plan.name}.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-5">
            <PaymentElement id="payment-element" />
            {message && <div id="payment-message" className="text-red-500 text-sm">{message}</div>}
        </form>
      </DialogBody>
      <DialogFooter className="flex-col !space-y-2">
         <div className="grid grid-cols-2 gap-2 w-full">
            <Button className="w-full" type="button" variant="ghost" onClick={onGoBack} disabled={isLoading}>
                Go Back
            </Button>
            <Button form="payment-element" className="w-full" type="submit" disabled={isLoading || !stripe || !elements}>
                {isLoading ? <Loader2 className="animate-spin" /> : `Pay ${priceString}`}
            </Button>
        </div>
        <p className="text-center text-muted-foreground text-xs px-6">
            Payments are non-refundable. Cancel anytime.
        </p>
      </DialogFooter>
    </>
  );
}

    