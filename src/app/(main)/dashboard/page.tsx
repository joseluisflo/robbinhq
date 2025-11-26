
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { useUser } from '@/firebase';

const cards = [
  {
    title: 'Total Agents',
    subtitle: 'All time',
    value: '3',
    badge: {
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      icon: Bot,
      iconColor: 'text-blue-500',
      text: '+2',
    },
    subtext: (
      <span className="text-blue-600 font-medium">
        +2 <span className="text-muted-foreground font-normal">since last month</span>
      </span>
    ),
  },
  {
    title: 'Tasks Completed',
    subtitle: 'Last 7 days',
    value: '128',
    badge: {
      color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      icon: ArrowUpRight,
      iconColor: 'text-green-500',
      text: '+18.2%',
    },
    subtext: (
      <span className="text-green-600 font-medium">
        +32 <span className="text-muted-foreground font-normal">vs prev. 7 days</span>
      </span>
    ),
  },
    {
    title: 'Active Tasks',
    subtitle: 'Currently running',
    value: '2',
    badge: {
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
      icon: Clock,
      iconColor: 'text-yellow-500',
      text: 'Live',
    },
    subtext: (
      <span className="text-muted-foreground font-medium">
        Your agents are working now.
      </span>
    ),
  },
];


export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Hi {user?.displayName || 'there'}</h2>
        <p className="text-muted-foreground">
          here's a quick overview of what's happned in the last 7 days.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 bg-background overflow-hidden rounded-xl border">
          {cards.map((card, i) => (
            <Card
              key={i}
              className="border-0 shadow-none rounded-none border-y lg:border-x lg:border-y-0 border-border last:border-b-0 first:border-t-0 lg:last:border-r-0 lg:first:border-l-0"
            >
              <CardContent className="flex flex-col h-full space-y-6 justify-between p-6">
                {/* Title & Subtitle */}
                <div className="space-y-0.25">
                  <div className="text-lg font-semibold text-foreground">{card.title}</div>
                  <div className="text-sm text-muted-foreground">{card.subtitle}</div>
                </div>

                {/* Information */}
                <div className="flex-1 flex flex-col gap-1.5 justify-end grow">
                  {/* Value & Delta */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                    <Badge
                      className={`${card.badge.color} px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-none`}
                    >
                      <card.badge.icon className={`w-3 h-3 ${card.badge.iconColor}`} />
                      {card.badge.text}
                    </Badge>
                  </div>
                  {/* Subtext */}
                  <div className="text-sm">{card.subtext}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
