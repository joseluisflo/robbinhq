
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, CheckCircle, Clock, ArrowUpRight, Zap, MessageSquare, Info } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';


const cards = [
  {
    title: 'Resolved Interactions',
    subtitle: 'Last 30 days',
    value: '243',
    badge: {
      color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      icon: ArrowUpRight,
      iconColor: 'text-green-500',
      text: '+15%',
    },
    subtext: (
      <span className="text-green-600 font-medium">
        +32 <span className="text-muted-foreground font-normal">vs prev. 30 days</span>
      </span>
    ),
    icon: MessageSquare,
  },
  {
    title: 'Time Saved',
    subtitle: 'Last 30 days',
    value: '12 hours',
    badge: {
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      icon: ArrowUpRight,
      iconColor: 'text-blue-500',
      text: '+15%',
    },
    subtext: (
      <span className="text-blue-600 font-medium">
        +1.5 hours <span className="text-muted-foreground font-normal">vs prev. 30 days</span>
      </span>
    ),
    icon: Clock,
  },
    {
    title: 'Immediate Responses',
    subtitle: 'Last 30 days',
    value: '98%',
    badge: {
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
      icon: ArrowUpRight,
      iconColor: 'text-yellow-500',
      text: '+2%',
    },
    subtext: (
      <span className="text-muted-foreground font-medium">
        Maintained high customer satisfaction.
      </span>
    ),
    icon: Zap,
  },
];

const leadsData = {
  newLeads: 54,
  returningLeads: 198,
  newPercent: 21.43,
  returningPercent: 78.57,
  topSource: 'Widget',
  leadQuality: 8.2,
};


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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    {/* New Leads */}
                    <div className="flex-1 flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1 mb-1">
                        <span className="text-2xl font-bold text-foreground">{leadsData.newLeads}</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                            {leadsData.newPercent}%
                        </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">New leads</span>
                        {/* Solid Progress Bar */}
                        <div className="w-full mt-1">
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                            <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${leadsData.newPercent}%` }}
                            />
                        </div>
                        </div>
                    </div>
                    {/* Returning Leads */}
                    <div className="flex-1 flex flex-col items-start gap-1 border-s border-muted ps-6">
                        <div className="flex items-center gap-1 mb-1">
                        <span className="text-2xl font-bold text-foreground">{leadsData.returningLeads}</span>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">Returning leads</span>
                        {/* Dotted Bar */}
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

                    {/* Extra Details */}
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
        </div>
    </div>
  );
}
