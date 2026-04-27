
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useActiveAgent } from '@/app/(main)/layout';
import { useAgentDashboardStats, type DashboardTimeRange } from '@/hooks/use-agent-domain';


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

export function InteractionChart() {
  const { activeAgent } = useActiveAgent();
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>("7d");
  const { stats, loading } = useAgentDashboardStats(activeAgent?.id, timeRange);

  const days = useMemo(() => {
    switch(timeRange) {
        case '30d': return 30;
        case '90d': return 90;
        default: return 7;
    }
  }, [timeRange]);
  const interactionData = stats?.interactionSeries || [];


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Interaction History</CardTitle>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: DashboardTimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
       {loading ? (
           <div className="h-[300px] w-full flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
        ) : (
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
              tickFormatter={(value, index) => {
                 // Show fewer labels on smaller ranges to prevent clutter
                if (days <= 10) return value;
                // Show roughly 7-8 labels for larger ranges
                const interval = Math.ceil(days / 7);
                return index % interval === 0 ? value : "";
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name, item) => (
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", 
                          name === 'widget' ? 'bg-[--color-widget]' : 
                          name === 'email' ? 'bg-[--color-email]' : 
                          name === 'phone' ? 'bg-[--color-phone]' :
                          'bg-[--color-total]'
                        )} />
                      <span className="capitalize">{name}</span>: <span className="font-bold">{value}</span>
                    </div>
                  )}
                />
              }
            />
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="total"
              type="natural"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
              stackId="a"
            />
             <Area
              dataKey="widget"
              type="natural"
              fill="transparent"
              stroke="var(--color-widget)"
              stackId="b"
            />
             <Area
              dataKey="email"
              type="natural"
              fill="transparent"
              stroke="var(--color-email)"
              stackId="c"
            />
          </AreaChart>
        </ChartContainer>
       )}
      </CardContent>
    </Card>
  );
}
