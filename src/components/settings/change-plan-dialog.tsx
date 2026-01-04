
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
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

type CreditPackageId = '20' | '40' | 'custom';

const creditPackages = {
  '20': {
    id: '20' as CreditPackageId,
    name: '$20 in credits',
    price: 2000, // in cents
    features: [
      { text: "Remove Watermark", included: false },
      { text: "Phone Channel", included: false },
    ],
  },
  '40': {
    id: '40' as CreditPackageId,
    name: '$40 in credits',
    price: 4000,
    features: [
      { text: "Remove Watermark", included: true },
      { text: "Phone Channel", included: false },
    ],
  },
  'custom': {
    id: 'custom' as CreditPackageId,
    name: 'Custom credits',
    price: 0, // This will be dynamic
    features: [
       { text: "Remove Watermark", included: true },
       { text: "Phone Channel", included: true },
    ]
  }
};


const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export function ChangePlanDialog({ children }: { children: React.ReactNode }) {
  const id = useId();
  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<CreditPackageId>('20');
  const [customAmount, setCustomAmount] = useState<number | string>(5);
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
            setCustomAmount(5);
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

            <form className="space-y-4">
              <RadioGroup 
                className="gap-2" 
                value={selectedPackageId}
                onValueChange={(value: CreditPackageId) => setSelectedPackageId(value)}
              >
                {Object.values(creditPackages).map(pkg => (
                  <Label key={pkg.id} htmlFor={`${id}-${pkg.id}`} className="relative flex w-full cursor-pointer items-start gap-3 rounded-md border border-input p-4 shadow-xs outline-none has-[:checked]:border-primary/50 has-[:checked]:bg-accent">
                    <RadioGroupItem
                      aria-describedby={`${id}-${pkg.id}-description`}
                      className="mt-0.5"
                      id={`${id}-${pkg.id}`}
                      value={pkg.id}
                    />
                    <div className="grid grow gap-2">
                      <p className="font-semibold">{pkg.name}</p>
                      
                       {pkg.id === 'custom' ? (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs" id={`${id}-${pkg.id}-description`}>
                                Enter an amount between $5 and $500.
                            </p>
                            {selectedPackageId === 'custom' && (
                                <div className="relative mt-2">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
                                    <Input 
                                        type="number"
                                        className="pl-6"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        min={5}
                                        max={500}
                                        onClick={(e) => e.preventDefault()}
                                    />
                                </div>
                            )}
                          </div>
                        ) : (
                          null // No description for fixed packages now
                        )}
                        
                        <ul className="space-y-1.5 text-xs text-muted-foreground pt-2">
                        {pkg.features.map((feature, idx) => (
                            <li key={idx} className={cn("flex items-center gap-2", !feature.included && "opacity-60")}>
                            {feature.included ? <CheckIcon className="size-3 text-green-500" /> : <XIcon className="size-3" />}
                            {feature.text}
                            </li>
                        ))}
                        </ul>
                    </div>
                  </Label>
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
