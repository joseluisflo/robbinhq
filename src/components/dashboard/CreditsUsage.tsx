'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const creditsUsageData = {
  totalUsed: 4500,
  avgCost: 1.2,
  breakdown: {
    widget: { percent: 60, color: 'bg-teal-400', textColor: 'text-teal-600' },
    email: { percent: 25, color: 'bg-destructive', textColor: 'text-destructive' },
    phone: { percent: 15, color: 'bg-amber-400', textColor: 'text-amber-600' },
  },
};

export function CreditsUsage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-0 pt-6 pb-5">
        <CardTitle>Credits Usage</CardTitle>
        <Select defaultValue="this-month">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Total Credits Used</div>
            <div className="text-2xl font-bold text-foreground">{creditsUsageData.totalUsed.toLocaleString()}</div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Avg. Cost / Interaction</div>
            <div className="text-2xl font-bold text-foreground">{creditsUsageData.avgCost}</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 w-full h-2.5 rounded-full overflow-hidden mb-3.5 bg-muted">
          <div className={creditsUsageData.breakdown.widget.color} style={{ width: `${creditsUsageData.breakdown.widget.percent}%` }} />
          <div className={creditsUsageData.breakdown.email.color} style={{ width: `${creditsUsageData.breakdown.email.percent}%` }} />
          <div className={creditsUsageData.breakdown.phone.color} style={{ width: `${creditsUsageData.breakdown.phone.percent}%` }} />
        </div>
        <div className="flex items-center gap-5">
          <div className={`flex items-center gap-1 text-xs ${creditsUsageData.breakdown.widget.textColor}`}>
            <span className={`size-2 rounded-full ${creditsUsageData.breakdown.widget.color} inline-block`} /> Widget
          </div>
          <div className={`flex items-center gap-1 text-xs ${creditsUsageData.breakdown.email.textColor}`}>
            <span className={`size-2 rounded-full ${creditsUsageData.breakdown.email.color} inline-block`} /> Email
          </div>
          <div className={`flex items-center gap-1 text-xs ${creditsUsageData.breakdown.phone.textColor}`}>
            <span className={`size-2 rounded-full ${creditsUsageData.breakdown.phone.color} inline-block`} /> Phone
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
