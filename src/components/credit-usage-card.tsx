
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function CreditUsageCard() {
  const usedCredits = 1;
  const totalCredits = 50;
  const percentage = (usedCredits / totalCredits) * 100;

  return (
    <Card>
      <CardHeader className="p-2">
        <div className="flex items-center justify-between text-sm">
          <CardTitle className="text-sm font-medium">Credits</CardTitle>
          <p className="text-muted-foreground">
            {usedCredits}/{totalCredits}
          </p>
        </div>
        <Progress value={percentage} className="h-1" />
      </CardHeader>
      <CardContent className="p-2 text-center">
        <p className="text-xs text-muted-foreground">
          Resets on Nov 30, 2025 at 6:00 PM
        </p>
        <Button className="w-full mt-3 h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}
