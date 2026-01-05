
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useActiveAgent } from '@/app/(main)/layout';
import { Skeleton } from './ui/skeleton';
import { ChangePlanDialog } from './settings/change-plan-dialog';


const PLAN_CREDITS = {
  free: 0,
  essential: 0,
  pro: 0,
};


export function CreditUsageCard() {
  const { userProfile, agentsLoading: profileLoading } = useActiveAgent();

  const planId = userProfile?.planId || 'free';
  const planCredits = PLAN_CREDITS[planId] || 0;
  const currentCredits = userProfile?.credits ?? 0;
  
  const totalCredits = Math.max(planCredits, currentCredits);
  
  const usedCredits = Math.max(0, totalCredits - currentCredits);

  const percentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  
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
          <p className="text-muted-foreground font-semibold">
            {currentCredits.toLocaleString()}
          </p>
        </div>
        <Progress value={percentage} className="h-1" />
      </CardHeader>
      <CardContent className="p-2 text-center">
        <ChangePlanDialog>
            <Button className="w-full mt-1 h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                Buy Credits
            </Button>
        </ChangePlanDialog>
      </CardContent>
    </Card>
  );
}
