'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateWorkflowDialog } from '@/components/create-workflow-dialog';
import { mockWorkflows } from '@/lib/data';
import type { Workflow } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowPage() {
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

      {mockWorkflows.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockWorkflows.map((workflow) => (
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
  return (
    <Card>
      <Link href={`/workflow/${workflow.id}`}>
        <div className="h-32 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-t-lg" />
      </Link>
      <CardFooter className="flex items-center justify-between p-4">
        <div className="grid gap-0.5">
          <Link href={`/workflow/${workflow.id}`} className="group">
            <p className="font-semibold group-hover:underline">{workflow.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(workflow.lastModified), { addSuffix: true })}
            </p>
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}