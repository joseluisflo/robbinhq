
'use client';

import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function CreditUsageCard() {
  const usedCredits = 1;
  const totalCredits = 50;
  const percentage = (usedCredits / totalCredits) * 100;

  return (
    <Card className="bg-transparent border-0 shadow-none">
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
        <Button className="w-full mt-3 h-9 font-semibold">
          <ArrowUp className="h-4 w-4 mr-2 rounded-full bg-primary-foreground text-primary p-0.5" />
          Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}
