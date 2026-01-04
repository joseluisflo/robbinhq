"use client";

import { CheckIcon, RefreshCcwIcon, XIcon, Loader2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckoutForm } from "./checkout-form";
import { createPaymentIntent } from "@/app/actions/stripe";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentStatus } from "./payment-status";

type CreditPackageId = '20' | '40';

const creditPackages = {
  '20': {
    id: '20',
    name: '$20 in credits',
    description: 'A quick top-up for your account.',
    amount: 2000,
  },
  '40': {
    id: '40',
    name: '$40 in credits',
    description: 'Best value for frequent users.',
    amount: 4000,
  },
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export function ChangePlanDialog({ children }: { children: React.ReactNode }) {
  const id = useId();
  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<CreditPackageId>('20');
  const [isProcessing, startTransition] = useTransition();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const { user } = useUser();
  const { toast } = useToast();
  
  const handleContinue = () => {
    // Logic will be added later
    return;
  }

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setClientSecret(null);
      setPaymentStatus(null);
    }
  }

  const selectedPackage = creditPackages[selectedPackageId];

  return (
    <Dialog onOpenChange={(open) => {
        if (!open) {
            setStep(1);
            setSelectedPackageId('20');
            setClientSecret(null);
            setPaymentStatus(null);
        }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        {step === 1 && (
          <>
            <div className="mb-2 flex flex-col gap-2">
              <div
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border"
              >
                <RefreshCcwIcon className="opacity-80" size={16} />
              </div>
              <DialogHeader>
                <DialogTitle className="text-left">Buy Credits</DialogTitle>
                <DialogDescription className="text-left">
                  Select a credit package to add to your account.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form className="space-y-5">
              <RadioGroup 
                className="gap-2" 
                defaultValue={selectedPackageId}
                onValueChange={(value: CreditPackageId) => setSelectedPackageId(value)}
              >
                {Object.values(creditPackages).map(pkg => (
                  <div key={pkg.id} className="relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent">
                    <RadioGroupItem
                      aria-describedby={`${id}-${pkg.id}-description`}
                      className="order-1 after:absolute after:inset-0"
                      id={`${id}-${pkg.id}`}
                      value={pkg.id}
                    />
                    <div className="grid grow gap-1">
                      <Label htmlFor={`${id}-${pkg.id}`}>{pkg.name}</Label>
                      <p className="text-muted-foreground text-xs" id={`${id}-${pkg.id}-description`}>
                        {pkg.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <div className="grid grid-cols-1">
                <Button className="w-full" type="button" onClick={handleContinue} disabled={isProcessing}>
                   {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 2 && clientSecret && (
          <Elements options={{ clientSecret }} stripe={stripePromise}>
            <CheckoutForm 
              onGoBack={handleGoBack} 
              plan={selectedPackage} // This will be adapted
              setPaymentStatus={setPaymentStatus}
              setStep={setStep}
            />
          </Elements>
        )}
        
        {step === 3 && paymentStatus && (
           <PaymentStatus status={paymentStatus} planName={selectedPackage.name} />
        )}

      </DialogContent>
    </Dialog>
  );
}
