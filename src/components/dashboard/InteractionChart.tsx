'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Calendar, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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

export function InteractionChart() {
  return (
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
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
