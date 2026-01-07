
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { useActiveAgent } from '@/app/(main)/layout';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Workflow, WorkflowBlock } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Function to generate a short, 4-character alphanumeric ID
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 6);
};


export function CreateWorkflowDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isCreating, startCreation] = useTransition();

  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();
  const { toast } = useToast();

  const dialogImage = {
    imageUrl: "https://files.tryrobbin.com/assets/dkHXeKR1M92uLZev3zgcPR7Gsw.avif",
    description: "Workflow creation visual",
    imageHint: "workflow diagram"
  };

  const handleCreateWorkflow = () => {
    if (!name || !user || !activeAgent?.id) return;
    
    startCreation(async () => {
      try {
        const workflowsCollection = collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'workflows');
        
        const triggerBlock: WorkflowBlock = {
          id: generateShortId(),
          type: 'Trigger',
          params: { description: '' },
        };

        const newWorkflow: Omit<Workflow, 'id'> = {
          name,
          status: 'disabled',
          createdAt: serverTimestamp(),
          lastModified: serverTimestamp(),
          blocks: [triggerBlock],
        };
        const docRef = await addDoc(workflowsCollection, newWorkflow);
        
        toast({ title: 'Success', description: 'Workflow created successfully.' });
        router.push(`/workflow/${docRef.id}`);
        setIsOpen(false);
      } catch (error: any) {
        console.error("Error creating workflow: ", error);
        toast({ title: 'Error', description: error.message || 'Could not create workflow.', variant: 'destructive'});
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setName('');
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-[425px]">
        {dialogImage && (
          <div className="p-2">
            <Image
              className="w-full rounded-md object-cover object-top h-48"
              src={dialogImage.imageUrl}
              width={382}
              height={216}
              alt={dialogImage.description}
              data-ai-hint={dialogImage.imageHint}
            />
          </div>
        )}
        <div className="space-y-6 px-6 pb-6">
          <DialogHeader>
            <DialogTitle>Name your workflow</DialogTitle>
            <DialogDescription>
              This will be used to identify your workflow across the platform.
            </DialogDescription>
            <div className="pt-4">
              <Label htmlFor="name" className="sr-only">
                Workflow Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Customer Onboarding"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateWorkflow();
                    }
                }}
              />
            </div>
          </DialogHeader>

          <DialogFooter className="grid grid-cols-2 gap-2 sm:flex-row sm:space-x-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleCreateWorkflow}
              disabled={!name || isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workflow
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
