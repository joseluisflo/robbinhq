
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, MessageSquare, Clock, Zap } from 'lucide-react';
import { useActiveAgent } from '@/app/(main)/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentDashboardStats } from '@/hooks/use-agent-domain';


export function StatCards() {
  const { activeAgent } = useActiveAgent();
  const { stats, loading } = useAgentDashboardStats(activeAgent?.id, '30d');
  const totalInteractions = stats?.statCards.totalInteractions ?? 0;
  const timeSavedInHours = stats?.statCards.timeSavedInHours ?? 0;
  const interactionDelta = Math.round(stats?.statCards.interactionDelta ?? 0);
  const timeSavedDelta = stats?.statCards.timeSavedDelta ?? 0;
  const immediateResponsesPercent = stats?.statCards.immediateResponsesPercent ?? 98;
  const immediateResponsesDelta = stats?.statCards.immediateResponsesDelta ?? 2;

  const cards = [
    {
      title: 'Resolved Interactions',
      subtitle: 'Last 30 days',
      value: totalInteractions,
      badge: {
        color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
        icon: ArrowUpRight,
        iconColor: 'text-green-500',
        text: `${interactionDelta >= 0 ? '+' : ''}${interactionDelta}%`,
      },
      subtext: (
        <span className="text-green-600 font-medium">
          {interactionDelta >= 0 ? '+' : ''}{interactionDelta}% <span className="text-muted-foreground font-normal">vs prev. 30 days</span>
        </span>
      ),
      icon: MessageSquare,
    },
    {
      title: 'Time Saved',
      subtitle: 'Last 30 days',
      value: `${timeSavedInHours} hours`,
      badge: {
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        icon: ArrowUpRight,
        iconColor: 'text-blue-500',
        text: `${timeSavedDelta >= 0 ? '+' : ''}${timeSavedDelta}h`,
      },
      subtext: (
        <span className="text-blue-600 font-medium">
          {timeSavedDelta >= 0 ? '+' : ''}{timeSavedDelta} hours <span className="text-muted-foreground font-normal">vs prev. 30 days</span>
        </span>
      ),
      icon: Clock,
    },
    {
      title: 'Immediate Responses',
      subtitle: 'Last 30 days',
      value: `${immediateResponsesPercent}%`,
      badge: {
        color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
        icon: ArrowUpRight,
        iconColor: 'text-yellow-500',
        text: `+${immediateResponsesDelta}%`,
      },
      subtext: (
        <span className="text-muted-foreground font-medium">
          Maintained high customer satisfaction.
        </span>
      ),
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 bg-background overflow-hidden rounded-xl border">
      {cards.map((card, i) => (
        <Card
          key={i}
          className="border-0 shadow-none rounded-none border-y lg:border-x lg:border-y-0 border-border last:border-b-0 first:border-t-0 lg:last:border-r-0 lg:first:border-l-0"
        >
          <CardContent className="flex flex-col h-full space-y-6 justify-between p-6">
            <div className="space-y-0.25">
              <div className="text-lg font-semibold text-foreground">{card.title}</div>
              <div className="text-sm text-muted-foreground">{card.subtitle}</div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 justify-end grow">
              {loading ? (
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                    <Badge
                    className={`${card.badge.color} px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-none`}
                    >
                    <card.badge.icon className={`w-3 h-3 ${card.badge.iconColor}`} />
                    {card.badge.text}
                    </Badge>
                </div>
              )}
              {loading ? (
                <Skeleton className="h-5 w-4/5" />
              ) : (
                <div className="text-sm">{card.subtext}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
