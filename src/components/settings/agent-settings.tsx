'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateAgent, deleteAgent } from '@/app/actions/agents';
import { Loader2, Copy, Trash2, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AgentSettings() {
  const { activeAgent, setActiveAgent, agents } = useActiveAgent();
  const { user } = useUser();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const isOnlyAgent = agents.length <= 1;

  const isChanged =
    name !== (activeAgent?.name || '') ||
    description !== (activeAgent?.description || '');

  useEffect(() => {
    if (activeAgent) {
      setName(activeAgent.name || '');
      setDescription(activeAgent.description || '');
    }
  }, [activeAgent]);

  const handleCopyId = () => {
    if (!activeAgent?.id) return;
    navigator.clipboard.writeText(activeAgent.id);
    toast({ title: 'Copied to clipboard!', description: 'Agent ID has been copied.' });
  };

  const handleSaveChanges = () => {
    if (!user || !activeAgent || !isChanged) return;

    startSaving(async () => {
      const dataToUpdate: Partial<{ name: string; description: string }> = {};
      if (name !== activeAgent.name) {
        dataToUpdate.name = name;
      }
      if (description !== activeAgent.description) {
        dataToUpdate.description = description;
      }

      const result = await updateAgent(user.uid, activeAgent.id!, dataToUpdate);

      if (result.error) {
        toast({
          title: 'Error updating agent',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Agent details have been updated.',
        });
        if (setActiveAgent) {
          setActiveAgent({ ...activeAgent, ...dataToUpdate });
        }
      }
    });
  };

  const handleDeleteAgent = () => {
    if (!user || !activeAgent || isOnlyAgent) return;
    
    startDeleting(async () => {
        const result = await deleteAgent(user.uid, activeAgent.id!);
        if (result.error) {
            toast({ title: 'Error deleting agent', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Agent deleted', description: `"${activeAgent.name}" has been permanently removed.` });
            const remainingAgents = agents.filter(a => a.id !== activeAgent.id);
            setActiveAgent(remainingAgents[0] || null);
            // The dialog will close automatically if we re-render its parent, which we will by changing active agent.
        }
    });
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Name</Label>
          <Input
            id="agent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-description">Description</Label>
          <Textarea
            id="agent-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-id">Agent ID</Label>
          <div className="flex items-center gap-2">
            <Input id="agent-id" value={activeAgent?.id || ''} readOnly />
            <Button variant="outline" size="icon" onClick={handleCopyId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This unique ID is used for API calls and integrations.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
        <div>
          <p className="font-medium">Delete agent</p>
          <p className="text-sm text-muted-foreground">
            Once deleted, all of its data will be gone forever.
          </p>
        </div>
        <div className='flex items-center justify-end'>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isOnlyAgent || isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Agent
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the agent
                        <span className="font-semibold text-foreground"> {activeAgent?.name} </span>
                        and all of its associated data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <div className="border-t pt-4">
        <Button
          onClick={handleSaveChanges}
          disabled={!isChanged || isSaving}
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
}
