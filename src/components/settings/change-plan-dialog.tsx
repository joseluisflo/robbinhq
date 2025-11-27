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

type PlanId = 'free' | 'essential' | 'pro';

const plans = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0 per month',
    features: [
      { text: '150 credits', included: true },
      { text: '1 Agent', included: true },
      { text: '400kb Training Data', included: true },
      { text: '2 Channel Deploy', included: false },
      { text: 'Limited Data retention', included: false },
      { text: 'Watermark', included: true },
    ],
  },
  essential: {
    id: 'essential',
    name: 'Essential',
    price: '$15 per month',
    features: [
      { text: '1500 Credits', included: true },
      { text: 'Unlimited Agents', included: true },
      { text: '40MB Training Data', included: true },
      { text: '3 Channel Deploy', included: true },
      { text: 'Unlimited Data retention', included: true },
      { text: 'No Watermark', included: true },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$29 per month',
    features: [
      { text: '5000 Credits', included: true },
      { text: 'Unlimited Agents', included: true },
      { text: '40MB Training Data', included: true },
      { text: '3 Channel Deploy', included: true },
      { text: 'Unlimited Data Retention', included: true },
      { text: 'No watermark', included: true },
    ],
  },
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export function ChangePlanDialog({ children }: { children: React.ReactNode }) {
  const id = useId();
  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('free');
  const [isProcessing, startTransition] = useTransition();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const { user } = useUser();
  const { toast } = useToast();
  
  const handleContinue = () => {
    if (step === 1 && selectedPlanId !== 'free' && user) {
        startTransition(async () => {
            const result = await createPaymentIntent({ userId: user.uid, planId: selectedPlanId });
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                setClientSecret(result.clientSecret);
                setStep(2);
            }
        });
    }
  }

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setClientSecret(null);
      setPaymentStatus(null);
    }
  }

  const selectedPlan = plans[selectedPlanId];

  return (
    <Dialog onOpenChange={(open) => {
        if (!open) {
            setStep(1);
            setSelectedPlanId('free');
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
                <DialogTitle className="text-left">Change your plan</DialogTitle>
                <DialogDescription className="text-left">
                  Pick one of the following plans.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form className="space-y-5">
              <RadioGroup 
                className="gap-2" 
                defaultValue={selectedPlanId}
                onValueChange={(value: PlanId) => setSelectedPlanId(value)}
              >
                {/* Plans Radio Cards */}
                {Object.values(plans).map(plan => (
                  <div key={plan.id} className="relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent">
                    <RadioGroupItem
                      aria-describedby={`${id}-${plan.id}-description`}
                      className="order-1 after:absolute after:inset-0"
                      id={`${id}-${plan.id}`}
                      value={plan.id}
                    />
                    <div className="grid grow gap-1">
                      <Label htmlFor={`${id}-${plan.id}`}>{plan.name}</Label>
                      <p className="text-muted-foreground text-xs" id={`${id}-${plan.id}-description`}>
                        {plan.price}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <div className="space-y-3">
                <p>
                  <strong className="font-medium text-sm">Features include:</strong>
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex gap-2">
                      {feature.included ? (
                        <CheckIcon aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={16} />
                      ) : (
                        <XIcon aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground/50" size={16} />
                      )}
                      <span className={!feature.included ? 'text-muted-foreground/50' : ''}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1">
                <Button className="w-full" type="button" onClick={handleContinue} disabled={isProcessing || selectedPlanId === 'free'}>
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
              plan={selectedPlan}
              setPaymentStatus={setPaymentStatus}
              setStep={setStep}
            />
          </Elements>
        )}
        
        {step === 3 && paymentStatus && (
           <PaymentStatus status={paymentStatus} planName={selectedPlan.name} />
        )}

      </DialogContent>
    </Dialog>
  );
}
