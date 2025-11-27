'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, collection, query } from '@/firebase';
import { useActiveAgent } from '@/app/(main)/layout';
import type { Lead } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export function LeadsOverview() {
  const { user } = useUser();
  const { activeAgent } = useActiveAgent();
  const firestore = useFirestore();

  const leadsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'leads'));
  }, [user, firestore, activeAgent?.id]);
  
  const { data: leads, loading } = useCollection<Lead>(leadsQuery);

  const leadsData = useMemo(() => {
    if (!leads) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

    const newLeadsCount = leads.filter(lead => lead.createdAt && (lead.createdAt as Timestamp) > thirtyDaysAgoTimestamp).length;
    const totalLeads = leads.length;
    const returningLeadsCount = totalLeads - newLeadsCount;

    const newPercent = totalLeads > 0 ? (newLeadsCount / totalLeads) * 100 : 0;
    const returningPercent = totalLeads > 0 ? (returningLeadsCount / totalLeads) * 100 : 0;
    
    const sourceCounts = leads.reduce((acc, lead) => {
        const source = lead.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topSource = Object.keys(sourceCounts).reduce((a, b) => sourceCounts[a] > sourceCounts[b] ? a : b, 'N/A');

    return {
        newLeads: newLeadsCount,
        returningLeads: returningLeadsCount,
        newPercent: newPercent,
        returningPercent: returningPercent,
        topSource: topSource,
        leadQuality: 8.2, // Hardcoded for now
    };
  }, [leads]);

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
