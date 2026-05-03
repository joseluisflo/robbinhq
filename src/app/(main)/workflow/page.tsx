'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateWorkflowDialog } from '@/components/create-workflow-dialog';
import type { Workflow } from '@/lib/types';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useActiveAgent } from '../layout';
import { listWorkflows } from '@/app/actions/workflow';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';


export default function WorkflowPage() {
  const { activeAgent } = useActiveAgent();
  const agentId = activeAgent?.id ?? null;

  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!agentId) {
      setWorkflows([]);
      setLoading(false);
      return;
    }
    try {
      const result = await listWorkflows(agentId);
      if ('error' in result) {
        console.error('Failed to load workflows:', result.error);
        setWorkflows([]);
      } else {
        setWorkflows(result.workflows);
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!agentId) return;
    const handleFocus = () => { void load(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [agentId, load]);

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
