'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { MoreHorizontal, PlusCircle, Loader2, Play, Pause, Trash2, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Workflow } from '@/lib/types';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser, useFirestore } from '@/firebase';
import { updateWorkflowStatus } from '@/app/actions/workflow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const { user } = useUser();
  const { activeAgent } = useActiveAgent();
  const { toast } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();

  const lastModifiedDate = workflow.lastModified instanceof Timestamp 
    ? workflow.lastModified.toDate() 
    : new Date();

  const handleStatusChange = (status: 'enabled' | 'disabled') => {
    if (!user || !activeAgent?.id || !workflow.id) return;
    startUpdateTransition(async () => {
      const result = await updateWorkflowStatus(user.uid, activeAgent.id!, workflow.id!, status);
      if ('error' in result) {
        toast({ title: 'Error', description: `Failed to ${status === 'enabled' ? 'enable' : 'disable'} workflow.`, variant: 'destructive'});
      } else {
        toast({ title: 'Success', description: `Workflow ${status === 'enabled' ? 'enabled' : 'disabled'}.`});
      }
    });
  }

  const isEnabled = workflow.status === 'enabled';

  return (
    <Card>
      <Link href={`/workflow/${workflow.id}`}>
        <div className="h-32 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-t-lg" />
      </Link>
      <CardContent className="p-4 border-b">
        <div className="flex items-start justify-between">
            <Link href={`/workflow/${workflow.id}`} className="group">
              <p className="font-semibold group-hover:underline">{workflow.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDistanceToNow(lastModifiedDate, { addSuffix: true })}
              </p>
            </Link>
            <Badge variant={isEnabled ? 'default' : 'secondary'} className={cn(isEnabled && "bg-green-600 hover:bg-green-600")}>
                {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex items-center justify-between gap-2">
         <Button variant="outline" asChild className="flex-1">
           <Link href={`/workflow/${workflow.id}`}>Edit</Link>
         </Button>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             {isEnabled ? (
              <DropdownMenuItem onSelect={() => handleStatusChange('disabled')} disabled={isUpdating}>
                <Pause className="mr-2 h-4 w-4" />
                Disable
              </DropdownMenuItem>
             ) : (
                <DropdownMenuItem onSelect={() => handleStatusChange('enabled')} disabled={isUpdating}>
                  <Play className="mr-2 h-4 w-4" />
                  Enable
                </DropdownMenuItem>
             )}
            <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
