
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useActiveAgent } from '@/app/(main)/layout';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { ChangePlanDialog } from './settings/change-plan-dialog';

const PLAN_CREDITS = {
  free: 150,
  essential: 2000,
  pro: 5000,
};


export function CreditUsageCard() {
  const { userProfile, agentsLoading: profileLoading } = useActiveAgent();

  const planId = userProfile?.planId || 'free';
  const totalCredits = PLAN_CREDITS[planId] || PLAN_CREDITS.free;
  const currentCredits = userProfile?.credits ?? 0;
  
  // Ensure usedCredits doesn't go below 0 if currentCredits > totalCredits (e.g., admin grant)
  const usedCredits = Math.max(0, totalCredits - currentCredits);
  const percentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  
  const resetDate = userProfile?.creditResetDate ? (userProfile.creditResetDate as Timestamp).toDate() : null;
  const formattedResetDate = resetDate ? format(resetDate, "MMM d") : 'N/A';

  if (profileLoading) {
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
        <ChangePlanDialog>
            <Button className="w-full mt-3 h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                Upgrade
            </Button>
        </ChangePlanDialog>
      </CardContent>
    </Card>
  );
}
