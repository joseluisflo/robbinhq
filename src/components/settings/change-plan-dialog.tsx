
"use client";

import { CheckIcon, RefreshCcwIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckoutForm } from "./checkout-form";

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
      { text: '2 Channel Deploy', included: true },
      { text: 'Limited Data retention', included: true },
      { text: 'Watermark', included: true },
    ],
  },
  essential: {
    id: 'essential',
    name: 'Essential',
    price: '$15 Per month',
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
    price: '$29 Per month',
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


export function ChangePlanDialog({ children }: { children: React.ReactNode }) {
  const id = useId();
  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('free');

  const handleContinue = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  }

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  const selectedPlan = plans[selectedPlanId];


  return (
    <Dialog onOpenChange={(open) => {
        if (!open) {
            setStep(1);
            setSelectedPlanId('free');
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
                {/* Radio card #1 */}
                <div className="relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent">
                  <RadioGroupItem
                    aria-describedby={`${id}-1-description`}
                    className="order-1 after:absolute after:inset-0"
                    id={`${id}-1`}
                    value="free"
                  />
                  <div className="grid grow gap-1">
                    <Label htmlFor={`${id}-1`}>Free</Label>
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${id}-1-description`}
                    >
                      $0 per month
                    </p>
                  </div>
                </div>
                {/* Radio card #2 */}
                <div className="relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent">
                  <RadioGroupItem
                    aria-describedby={`${id}-2-description`}
                    className="order-1 after:absolute after:inset-0"
                    id={`${id}-2`}
                    value="essential"
                  />
                  <div className="grid grow gap-1">
                    <Label htmlFor={`${id}-2`}>Essential</Label>
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${id}-2-description`}
                    >
                      $15 Per month
                    </p>
                  </div>
                </div>
                {/* Radio card #3 */}
                <div className="relative flex w-full items-center gap-2 rounded-md border border-input px-4 py-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent">
                  <RadioGroupItem
                    aria-describedby={`${id}-3-description`}
                    className="order-1 after:absolute after:inset-0"
                    id={`${id}-3`}
                    value="pro"
                  />
                  <div className="grid grow gap-1">
                    <Label htmlFor={`${id}-3`}>Pro</Label>
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${id}-3-description`}
                    >
                      $29 Per month
                    </p>
                  </div>
                </div>
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

              <div className="grid grid-cols-2 gap-2">
                 <DialogClose asChild>
                  <Button className="w-full" type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button className="w-full" type="button" onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <CheckoutForm onGoBack={handleGoBack} />
        )}
      </DialogContent>
    </Dialog>
  );
}

