
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
import { Bot, CheckCircle, Clock, ArrowUpRight, Zap, MessageSquare, Info, Separator, Download, Calendar, MoreHorizontal } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';


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

const creditsUsageData = {
  totalUsed: 4500,
  avgCost: 1.2,
  breakdown: {
    widget: { percent: 60, color: 'bg-teal-400', textColor: 'text-teal-600' },
    email: { percent: 25, color: 'bg-destructive', textColor: 'text-destructive' },
    phone: { percent: 15, color: 'bg-amber-400', textColor: 'text-amber-600' },
  },
};

const interactionData = [
  { date: '1 Jul', total: 62, widget: 40, email: 15, phone: 7 },
  { date: '2 Jul', total: 75, widget: 50, email: 18, phone: 7 },
  { date: '3 Jul', total: 88, widget: 55, email: 23, phone: 10 },
  { date: '4 Jul', total: 80, widget: 52, email: 20, phone: 8 },
  { date: '5 Jul', total: 95, widget: 60, email: 25, phone: 10 },
  { date: '6 Jul', total: 110, widget: 70, email: 30, phone: 10 },
  { date: '7 Jul', total: 120, widget: 78, email: 32, phone: 10 },
];

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--chart-1))',
  },
  widget: {
    label: 'Widget',
    color: 'hsl(var(--chart-2))',
  },
  email: {
    label: 'Email',
    color: 'hsl(var(--chart-3))',
  },
  phone: {
    label: 'Phone',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;


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
                    {/* Stats Row */}
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
                    {/* Segmented Progress Bar */}
                    <div className="flex items-center gap-0.5 w-full h-2.5 rounded-full overflow-hidden mb-3.5 bg-muted">
                        <div className={creditsUsageData.breakdown.widget.color} style={{ width: `${creditsUsageData.breakdown.widget.percent}%` }} />
                        <div className={creditsUsageData.breakdown.email.color} style={{ width: `${creditsUsageData.breakdown.email.percent}%` }} />
                        <div className={creditsUsageData.breakdown.phone.color} style={{ width: `${creditsUsageData.breakdown.phone.percent}%` }} />
                    </div>
                    {/* Legend */}
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
        </div>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interaction History</CardTitle>
               <div className="flex gap-2">
                    <Select defaultValue="7d">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><Download className="mr-2 h-4 w-4"/>Export Data</DropdownMenuItem>
                            <DropdownMenuItem><Calendar className="mr-2 h-4 w-4"/>Change Period</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
               </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart
                    accessibilityLayer
                    data={interactionData}
                    margin={{
                      left: -20,
                      right: 20,
                      top: 10,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          label="Interactions"
                          indicator="dot"
                          formatter={(value, name) => {
                            const config = chartConfig[name as keyof typeof chartConfig];
                            return <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: config.color}}/>{config.label}: <span className="font-bold">{value}</span></div>
                          }}
                        />
                      }
                    />
                    <Area
                      dataKey="total"
                      type="natural"
                      fill="var(--color-total)"
                      fillOpacity={0.4}
                      stroke="var(--color-total)"
                    />
                  </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}

    