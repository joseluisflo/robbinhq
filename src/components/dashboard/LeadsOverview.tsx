'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const leadsData = {
  newLeads: 54,
  returningLeads: 198,
  newPercent: 21.43,
  returningPercent: 78.57,
  topSource: 'Widget',
  leadQuality: 8.2,
};

export function LeadsOverview() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-0 pt-6 pb-5">
        <CardTitle>Leads Overview</CardTitle>
        <Select defaultValue="this-month">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex items-stretch gap-x-6 mb-4">
          <div className="flex-1 flex flex-col items-start gap-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-2xl font-bold text-foreground">{leadsData.newLeads}</span>
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                {leadsData.newPercent}%
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground font-medium">New leads</span>
            <div className="w-full mt-1">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${leadsData.newPercent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-start gap-1 border-s border-muted ps-6">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-2xl font-bold text-foreground">{leadsData.returningLeads}</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">Returning leads</span>
            <div className="w-full mt-1 flex gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2.5 w-0.5 rounded-full flex-1',
                    i < Math.round((leadsData.returningPercent / 100) * 30) ? 'bg-green-500' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-x-4 mb-1.5 pt-4 border-t">
          <div className="flex flex-col flex-1 gap-0.5">
            <span className="text-xs text-muted-foreground">Top Source</span>
            <span className="text-sm font-medium text-foreground">{leadsData.topSource}</span>
          </div>
          <div className="flex flex-col flex-1 gap-0.5 ps-6 border-l border-muted">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Lead Quality
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>An internal score based on interaction depth.</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="text-sm font-medium text-foreground">{leadsData.leadQuality} / 10</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
