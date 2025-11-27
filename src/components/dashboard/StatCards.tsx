
'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, MessageSquare, Clock, Zap } from 'lucide-react';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser, useFirestore, useCollection, collection, query } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatSession, EmailSession } from '@/lib/types';


export function StatCards() {
  const { user } = useUser();
  const { activeAgent } = useActiveAgent();
  const firestore = useFirestore();
  
  // Query for chat sessions
  const chatSessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions'));
  }, [user, firestore, activeAgent?.id]);
  const { data: chatSessions, loading: chatLoading } = useCollection<ChatSession>(chatSessionsQuery);

  // Query for email sessions
  const emailSessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'emailSessions'));
  }, [user, firestore, activeAgent?.id]);
  const { data: emailSessions, loading: emailLoading } = useCollection<EmailSession>(emailSessionsQuery);
  
  const loading = chatLoading || emailLoading;
  
  const totalInteractions = (chatSessions?.length || 0) + (emailSessions?.length || 0);
  const timeSavedInHours = Math.round((totalInteractions * 3) / 60);

  const cards = [
    {
      title: 'Resolved Interactions',
      subtitle: 'Last 30 days',
      value: totalInteractions,
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
      value: `${timeSavedInHours} hours`,
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
