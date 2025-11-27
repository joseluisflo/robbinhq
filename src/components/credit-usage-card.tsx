'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { userProfile } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';

const PLAN_CREDITS = {
  free: 2000,
  essential: 15000,
  pro: 50000,
};


export function CreditUsageCard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, loading } = useDoc<userProfile>(userProfileRef);

  const planId = userProfile?.planId || 'free';
  const totalCredits = PLAN_CREDITS[planId] || PLAN_CREDITS.free;
  const currentCredits = userProfile?.credits ?? totalCredits;
  const usedCredits = totalCredits - currentCredits;
  const percentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  
  const resetDate = userProfile?.creditResetDate?.toDate();
  const formattedResetDate = resetDate ? format(resetDate, "MMM d, yyyy 'at' p") : 'N/A';

  if (loading) {
    return (
        <Card>
            <CardHeader className="p-2 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-1 w-full" />
            </CardHeader>
            <CardContent className="p-2 text-center space-y-2">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-9 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-2">
        <div className="flex items-center justify-between text-sm">
          <CardTitle className="text-sm font-medium">Credits</CardTitle>
          <p className="text-muted-foreground">
            {usedCredits.toLocaleString()}/{totalCredits.toLocaleString()}
          </p>
        </div>
        <Progress value={percentage} className="h-1" />
      </CardHeader>
      <CardContent className="p-2 text-center">
        <p className="text-xs text-muted-foreground">
          Resets on {formattedResetDate}
        </p>
        <Button className="w-full mt-3 h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}
