'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

function PaymentStatusContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('status');

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center text-center gap-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                    Your plan has been upgraded. You can now enjoy your new features.
                </CardDescription>
                <Button className="mt-4 w-full" onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                </Button>
            </div>
        );
    }
    
    if (status === 'cancelled') {
        return (
            <div className="flex flex-col items-center justify-center text-center gap-4">
                <XCircle className="h-16 w-16 text-destructive" />
                <CardTitle>Payment Cancelled</CardTitle>
                <CardDescription>
                    Your payment was cancelled. Your plan has not been changed.
                </CardDescription>
                 <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
         <div className="flex flex-col items-center justify-center text-center gap-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
            <CardTitle>Payment Status Unknown</CardTitle>
            <CardDescription>
                We could not determine the status of your payment. Please check your dashboard or contact support.
            </CardDescription>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
            </Button>
        </div>
    );
}

export default function PaymentStatusPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-6">
                <CardHeader className="p-0">
                     <Suspense fallback={<div>Loading...</div>}>
                        <PaymentStatusContent />
                    </Suspense>
                </CardHeader>
            </Card>
        </div>
    );
}
