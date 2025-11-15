'use client';

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
import { CreateWorkflowDialog } from '@/components/create-workflow-dialog';
import type { Workflow } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, PlusCircle, Loader2, Play, Pause, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { useActiveAgent } from '../layout';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import { useMemo, useTransition } from 'react';
import { Timestamp } from 'firebase/firestore';
import { updateWorkflowStatus } from '@/app/actions/workflow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export default function WorkflowPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();

  const workflowsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'workflows'));
  }, [user, firestore, activeAgent?.id]);
  
  const { data: workflows, loading } = useCollection<Workflow>(workflowsQuery);

  if (loading) {
     return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Workflow</h2>
        <CreateWorkflowDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </CreateWorkflowDialog>
      </div>

      {workflows && workflows.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <p className="font-semibold">No workflows created yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Get started by creating your first workflow.
            </p>
            <CreateWorkflowDialog>
                <Button variant="secondary" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Workflow
                </Button>
            </CreateWorkflowDialog>
        </div>
      )}
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
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
