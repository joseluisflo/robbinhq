
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Calendar, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser, useFirestore, useCollection, collection, query, where } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { subDays, format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import type { ChatSession, EmailSession } from '@/lib/types';


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
  const { user } = useUser();
  const { activeAgent } = useActiveAgent();
  const firestore = useFirestore();

  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);
  const sevenDaysAgoTimestamp = useMemo(() => Timestamp.fromDate(sevenDaysAgo), [sevenDaysAgo]);

  const chatSessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions'),
      where('createdAt', '>=', sevenDaysAgoTimestamp)
    );
  }, [user, firestore, activeAgent?.id, sevenDaysAgoTimestamp]);
  const { data: chatSessions, loading: chatLoading } = useCollection<ChatSession>(chatSessionsQuery);

  const emailSessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'emailSessions'),
      where('createdAt', '>=', sevenDaysAgoTimestamp)
    );
  }, [user, firestore, activeAgent?.id, sevenDaysAgoTimestamp]);
  const { data: emailSessions, loading: emailLoading } = useCollection<EmailSession>(emailSessionsQuery);
  
  const loading = chatLoading || emailLoading;

  const interactionData = useMemo(() => {
    if (!chatSessions || !emailSessions) return [];

    const dataByDate: Record<string, { date: string; total: number; widget: number; email: number, phone: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const formattedDate = format(date, 'd MMM');
      dataByDate[formattedDate] = { date: formattedDate, total: 0, widget: 0, email: 0, phone: 0 };
    }

    chatSessions.forEach(session => {
      if (session.createdAt) {
        const date = (session.createdAt as Timestamp).toDate();
        const formattedDate = format(date, 'd MMM');
        if (dataByDate[formattedDate]) {
          dataByDate[formattedDate].widget++;
          dataByDate[formattedDate].total++;
        }
      }
    });
    
    emailSessions.forEach(session => {
        if (session.createdAt) {
            const date = (session.createdAt as Timestamp).toDate();
            const formattedDate = format(date, 'd MMM');
            if (dataByDate[formattedDate]) {
                dataByDate[formattedDate].email++;
                dataByDate[formattedDate].total++;
            }
        }
    });

    return Object.values(dataByDate);
  }, [chatSessions, emailSessions]);


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
