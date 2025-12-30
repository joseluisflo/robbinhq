
'use client';

import {
  Card,
  CardFooter,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Phone, Lock } from 'lucide-react';
import Link from 'next/link';
import { useActiveAgent } from '../layout';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const allChannels = [
  {
    name: 'Chat',
    description: 'Deploy as a chat widget',
    icon: MessageCircle,
    href: '/deploy/chat',
    requiredPlan: 'free',
  },
  {
    name: 'Email',
    description: 'Connect to an email address',
    icon: Mail,
    href: '/deploy/email',
    requiredPlan: 'free',
  },
  {
    name: 'Phone',
    description: 'Integrate with a phone number',
    icon: Phone,
    href: '/deploy/phone',
    requiredPlan: 'free',
  },
];

export default function DeployPage() {
  const { userProfile } = useActiveAgent();
  const userPlan = userProfile?.planId || 'free';
  
  const isPlanSufficient = (requiredPlan: string) => {
    if (requiredPlan === 'free') return true;
    if (userPlan === 'essential' || userPlan === 'pro') return true;
    return false;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy</h2>
      </div>

      <TooltipProvider>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allChannels.map((channel) => {
            const isEnabled = isPlanSufficient(channel.requiredPlan);
            const CardContentWrapper = isEnabled ? Link : 'div';

            return (
              <Card key={channel.name} className={cn(!isEnabled && 'bg-muted/50')}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <CardContentWrapper 
                            href={isEnabled ? channel.href : undefined} 
                            className={cn("block transition-opacity", isEnabled ? "hover:opacity-90" : "cursor-not-allowed")}
                        >
                            <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600 rounded-t-lg flex items-center justify-center relative">
                                <channel.icon className={cn("h-12 w-12", isEnabled ? "text-white/80" : "text-white/30")} />
                                {!isEnabled && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Lock className="h-8 w-8 text-white/70" />
                                    </div>
                                )}
                            </div>
                        </CardContentWrapper>
                    </TooltipTrigger>
                    {!isEnabled && (
                         <TooltipContent>
                            <p>Upgrade to Essential or Pro to unlock this channel.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
                 <CardContent className="p-4 border-b">
                    <CardContentWrapper 
                        href={isEnabled ? channel.href : undefined} 
                        className={cn("group", !isEnabled && "cursor-not-allowed")}
                    >
                      <p className="font-semibold group-hover:underline">
                        {channel.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {channel.description}
                      </p>
                    </CardContentWrapper>
                  </CardContent>
                <CardFooter className="p-4">
                   <Button variant="outline" asChild className="w-full" disabled={!isEnabled}>
                     <Link href={isEnabled ? channel.href : '#'}>Setup</Link>
                   </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
