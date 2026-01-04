
"use client";

import { CheckIcon, RefreshCcwIcon, XIcon, Loader2 } from "lucide-react";
import { useId, useState, useTransition, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckoutForm } from "./checkout-form";
import { createPaymentIntent } from "@/app/actions/stripe";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentStatus } from "./payment-status";
import { NumberInput } from "../ui/number-input";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";


type CreditPackageId = '20' | '40' | 'custom';

const creditPackages = {
  '20': {
    id: '20' as CreditPackageId,
    name: '$20 in credits',
    price: 2000, // in cents
    description: "Perfect for getting started.",
    features: [
      { text: "Remove Watermark", included: false },
      { text: "Phone Channel", included: false },
    ],
  },
  '40': {
    id: '40' as CreditPackageId,
    name: '$40 in credits',
    price: 4000,
    description: "Ideal for growing businesses.",
    features: [
      { text: "Remove Watermark", included: true },
      { text: "Phone Channel", included: false },
    ],
  },
  'custom': {
    id: 'custom' as CreditPackageId,
    name: 'Custom credits',
    price: 0, // This will be dynamic
    description: "For power users and enterprises.",
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
  const [customAmount, setCustomAmount] = useState<number | string>(10);
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);
  const [isProcessing, startTransition] = useTransition();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [autoRecharge, setAutoRecharge] = useState(false);
  const [rechargeThreshold, setRechargeThreshold] = useState<number | string>(10);
  const [rechargeAmount, setRechargeAmount] = useState<number | string>(20);
  const [rechargeAmountError, setRechargeAmountError] = useState<string | null>(null);

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

  const handleCustomAmountChange = (value: number) => {
    setCustomAmount(value);
  };

  useEffect(() => {
    if (selectedPackageId === 'custom') {
      const numericValue = Number(customAmount);
      if (isNaN(numericValue) || numericValue < 10 || numericValue > 500) {
        setCustomAmountError("The amount need to be between $10 and $500.");
      } else {
        setCustomAmountError(null);
      }
    } else {
      setCustomAmountError(null);
    }
  }, [selectedPackageId, customAmount]);

  useEffect(() => {
    if (autoRecharge) {
        const numericValue = Number(rechargeAmount);
        if (isNaN(numericValue) || numericValue < 10) {
            setRechargeAmountError("Min amount is $10");
        } else {
            setRechargeAmountError(null);
        }
    } else {
        setRechargeAmountError(null);
    }
  }, [autoRecharge, rechargeAmount]);


  const selectedPackage = creditPackages[selectedPackageId];
  const isContinueDisabled = isProcessing || (selectedPackageId === 'custom' && !!customAmountError) || (autoRecharge && !!rechargeAmountError);

  return (
    <Dialog onOpenChange={(open) => {
        if (!open) {
            setStep(1);
            setSelectedPackageId('20');
            setClientSecret(null);
            setPaymentStatus(null);
            setCustomAmount(10);
            setCustomAmountError(null);
        }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        {step === 1 && (
          <>
            <DialogHeader>
              <div
                aria-hidden="true"
                className="mx-auto mb-4 flex size-11 shrink-0 items-center justify-center rounded-full border sm:mx-0"
              >
                <RefreshCcwIcon className="opacity-80" size={16} />
              </div>
              <div>
                <DialogTitle>Buy Credits</DialogTitle>
                <DialogDescription>
                  Pick one of the following credit packages.
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-6">
               <div className="gap-2 flex flex-col">
                {Object.values(creditPackages).map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={cn(
                        "relative flex w-full cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 shadow-sm transition-colors",
                        selectedPackageId === pkg.id ? "border-primary" : ""
                    )}
                  >
                    <div className="grid grow gap-2">
                      <p className="font-semibold">{pkg.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {pkg.id === 'custom' ? "Enter an amount between $10 and $500." : pkg.description}
                      </p>
                       {pkg.id === 'custom' && selectedPackageId === 'custom' && (
                          <div className="relative mt-2">
                              <NumberInput
                                className={cn(customAmountError && "border-destructive focus-visible:ring-destructive")}
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                min={10}
                                max={500}
                                step={1}
                                symbol="$"
                                onClick={(e) => e.preventDefault()}
                              />
                               {customAmountError && (
                                <p className="text-xs text-destructive mt-1.5">{customAmountError}</p>
                               )}
                          </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="auto-recharge-toggle">Auto recharge</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically buy credits when your balance is low.
                        </p>
                    </div>
                    <Switch
                        id="auto-recharge-toggle"
                        checked={autoRecharge}
                        onCheckedChange={setAutoRecharge}
                        className="h-5 w-9"
                    />
                </div>
                {autoRecharge && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label>When balance goes below</Label>
                            <NumberInput 
                                value={rechargeThreshold}
                                onChange={setRechargeThreshold}
                                min={5}
                                max={100}
                                step={5}
                                symbol="$"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Recharge with</Label>
                            <NumberInput 
                                className={cn(rechargeAmountError && "border-destructive focus-visible:ring-destructive")}
                                value={rechargeAmount}
                                onChange={setRechargeAmount}
                                min={10}
                                max={500}
                                step={5}
                                symbol="$"
                            />
                            {rechargeAmountError && (
                               <p className="text-xs text-destructive pt-1">{rechargeAmountError}</p>
                            )}
                        </div>
                    </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                  <p className="font-semibold text-sm">Features include:</p>
                   <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {selectedPackage.features.map((feature, idx) => (
                            <li key={idx} className={cn("flex items-center gap-2", !feature.included && "opacity-60")}>
                            {feature.included ? <CheckIcon className="size-4 text-green-500" /> : <XIcon className="size-4" />}
                            {feature.text}
                            </li>
                        ))}
                   </ul>
              </div>
            </DialogBody>
            <DialogFooter>
                <Button className="w-full" type="button" onClick={handleContinue} disabled={isContinueDisabled}>
                   {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
            </DialogFooter>
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
