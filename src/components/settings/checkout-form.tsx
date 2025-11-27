"use client";

import { CreditCardIcon, StoreIcon, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CheckoutFormProps {
    onGoBack: () => void;
    plan: {
        id: string;
        name: string;
        price: string;
    };
    setPaymentStatus: (status: string) => void;
    setStep: (step: number) => void;
}

export function CheckoutForm({ onGoBack, plan, setPaymentStatus, setStep }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is not strictly needed if we handle result on this page
        return_url: `${window.location.origin}/payment-status`,
      },
      // Redirect is handled manually below based on status
      redirect: 'if_required', 
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
      setPaymentStatus('error');
      setStep(3);
    } else {
      // The payment has been processed!
      // The webhook will handle the backend update. We can show success here.
      setPaymentStatus('succeeded');
      setStep(3);
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="mb-2 flex flex-col gap-2">
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border"
        >
          <StoreIcon className="opacity-80" size={16} />
        </div>
        <DialogHeader>
          <DialogTitle className="text-left">Confirm and pay - {plan.name} Plan</DialogTitle>
          <DialogDescription className="text-left">
            Pay securely and cancel any time.
          </DialogDescription>
        </DialogHeader>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <PaymentElement id="payment-element" />

        {message && <div id="payment-message" className="text-red-500 text-sm">{message}</div>}

        <div className="grid grid-cols-2 gap-2">
          <Button className="w-full" type="button" variant="ghost" onClick={onGoBack} disabled={isLoading}>
            Go Back
          </Button>
          <Button className="w-full" type="submit" disabled={isLoading || !stripe || !elements}>
            {isLoading ? <Loader2 className="animate-spin" /> : `Pay ${plan.price.split(' ')[0]}`}
          </Button>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-4">
          Payments are non-refundable. Cancel anytime.
        </p>
      </form>
    </>
  );
}