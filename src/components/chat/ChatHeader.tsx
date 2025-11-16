
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MoreHorizontal, X } from 'lucide-react';

interface ChatHeaderProps {
  agentName: string;
  isDisplayNameEnabled: boolean;
  logoUrl?: string;
}

export function ChatHeader({ agentName, isDisplayNameEnabled, logoUrl }: ChatHeaderProps) {
  const getInitials = (name: string) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 border-b flex items-center justify-between bg-card">
      {isDisplayNameEnabled ? (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {logoUrl && <AvatarImage src={logoUrl} alt={agentName} />}
            <AvatarFallback>{getInitials(agentName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{agentName}</p>
            <p className="text-xs text-muted-foreground">The team can also help</p>
          </div>
        </div>
      ) : <div />}
      <div className={cn("flex items-center gap-1", !isDisplayNameEnabled && "w-full justify-end")}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

    