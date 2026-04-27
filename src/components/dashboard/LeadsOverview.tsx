
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveAgent } from '@/app/(main)/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentDashboardStats } from '@/hooks/use-agent-domain';


export function LeadsOverview() {
  const { activeAgent } = useActiveAgent();
  const { stats, loading } = useAgentDashboardStats(activeAgent?.id, '30d');
  const leadsData = stats?.leadsOverview;

  if (loading || !leadsData) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between border-0 pt-6 pb-5">
                <CardTitle>Leads Overview</CardTitle>
                 <Select defaultValue="this-month" disabled>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                </Select>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-stretch gap-x-6 mb-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-2.5 w-full mt-1" />
                    </div>
                     <div className="flex-1 space-y-2 border-s border-muted ps-6">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-2.5 w-full mt-1" />
                    </div>
                </div>
                <div className="pt-4 border-t">
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }
  

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
                {leadsData.newPercent.toFixed(0)}%
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
        </div>
      </CardContent>
    </Card>
  );
}
