'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { createAgent } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export function CreateAgentDialog({
  children,
  open: controlledOpen,
  onAgentCreated,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onAgentCreated?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [isCreating, startCreationTransition] = useTransition();
  
  const { user } = useUser();
  const { toast } = useToast();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOpen !== undefined ? (open: boolean) => {
    // This component should not be closable by clicking outside when controlled
    if (controlledOpen && !open) return;
    setInternalOpen(open);
  } : setInternalOpen;

  const dialogImage = PlaceHolderImages.find((img) => img.id === 'dialog-create-agent');

  const handleContinue = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleCreateAgent = () => {
    if (!user || !name || !description) return;
    startCreationTransition(async () => {
      const result = await createAgent(user.uid, name, description);
      if ('error' in result) {
        toast({ title: 'Failed to create agent', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Agent Created!', description: `"${name}" is ready.` });
        if (onAgentCreated) {
          onAgentCreated();
        }
        setIsOpen(false);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    // Prevent closing via Escape key if it's the mandatory dialog
    if (controlledOpen && !open) {
      return;
    }
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setName('');
        setDescription('');
      }, 200);
    }
  };
  
  const isNextDisabled = (step === 1 && !name) || (step === 2 && !description);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent 
        className="gap-0 p-0 sm:max-w-md" 
        onInteractOutside={(e) => {
          if (controlledOpen) e.preventDefault();
        }}
      >
        {dialogImage && (
          <div className="p-2">
            <Image
              className="w-full rounded-md object-cover h-40"
              src={dialogImage.imageUrl}
              width={382}
              height={216}
              alt={dialogImage.description}
              data-ai-hint={dialogImage.imageHint}
            />
          </div>
        )}
        <div className="space-y-6 px-6 pt-3 pb-6">
          <div className="min-h-[140px]">
            {step === 1 && (
              <DialogHeader>
                <DialogTitle>Give your agent a name</DialogTitle>
                <DialogDescription>This name will be used to identify your agent across the platform.</DialogDescription>
                <div className="pt-4">
                  <Label htmlFor="name" className="sr-only">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fitness Assistant" />
                </div>
              </DialogHeader>
            )}
            {step === 2 && (
              <DialogHeader>
                <DialogTitle>Describe your agent's purpose</DialogTitle>
                <DialogDescription>A brief description of what your agent will do.</DialogDescription>
                <div className="pt-4">
                  <Label htmlFor="description" className="sr-only">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. An assistant that suggests bodyweight workouts and meal plans." className="min-h-[80px]" />
                </div>
              </DialogHeader>
            )}
          </div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              <div className={cn("size-1.5 rounded-full", step === 1 ? "bg-primary" : "bg-primary/20")} />
              <div className={cn("size-1.5 rounded-full", step === 2 ? "bg-primary" : "bg-primary/20")} />
            </div>
            <DialogFooter>
              {step < 2 ? (
                <Button className="group" type="button" onClick={handleContinue} disabled={isNextDisabled}>
                  Next
                  <ArrowRightIcon className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />
                </Button>
              ) : (
                <Button type="button" onClick={handleCreateAgent} disabled={isCreating || isNextDisabled}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Agent
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
