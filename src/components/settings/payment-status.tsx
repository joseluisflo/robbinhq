"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";

interface PaymentStatusProps {
    status: string;
    planName: string;
}

export function PaymentStatus({ status, planName }: PaymentStatusProps) {
    if (status === 'succeeded') {
        return (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-semibold">Payment Successful!</h3>
                <p className="text-muted-foreground">
                    You have successfully subscribed to the <span className="font-semibold text-foreground">{planName}</span> plan.
                    Your new features are now available.
                </p>
                <DialogClose asChild>
                    <Button className="mt-4 w-full">Got it, thanks!</Button>
                </DialogClose>
            </div>
        );
    }

    if (status === 'error') {
         return (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
                <XCircle className="h-16 w-16 text-destructive" />
                <h3 className="text-xl font-semibold">Payment Failed</h3>
                <p className="text-muted-foreground">
                    There was an issue processing your payment. Please check your card details and try again.
                </p>
                {/* We can add a 'Go Back' button here if needed */}
                <DialogClose asChild>
                   <Button variant="outline" className="mt-4 w-full">Close</Button>
                </DialogClose>
            </div>
        );
    }
    
    // Fallback for other statuses like 'processing'
    return (
        <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
            <h3 className="text-xl font-semibold">Payment Processing</h3>
            <p className="text-muted-foreground">
                Your payment is still processing. We will notify you once it's complete.
            </p>
            <DialogClose asChild>
                <Button className="mt-4 w-full">Close</Button>
            </DialogClose>
        </div>
    );
}
