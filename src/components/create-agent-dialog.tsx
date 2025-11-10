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
import { ArrowRightIcon, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getGoalSuggestions, createAgent } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export function CreateAgentDialog({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onAgentCreated,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAgentCreated?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [isCreating, startCreationTransition] = useTransition();
  
  const { user } = useUser();
  const { toast } = useToast();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const dialogImage = PlaceHolderImages.find((img) => img.id === 'dialog-create-agent');

  const handleSuggestGoals = () => {
    if (!description) return;
    startSuggestionTransition(async () => {
      const result = await getGoalSuggestions(description);
      if ('error' in result) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        setGoals(result);
      }
    });
  };

  const handleContinue = () => {
    if (step === 2) {
      handleSuggestGoals();
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleCreateAgent = () => {
    if (!user || !name) return;
    startCreationTransition(async () => {
      const result = await createAgent(user.uid, name, description, goals);
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
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setName('');
        setDescription('');
        setGoals([]);
      }, 200);
    }
  };
  
  const isNextDisabled = (step === 1 && !name) || (step === 2 && !description);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="gap-0 p-0 sm:max-w-md" onInteractOutside={(e) => {
        // Prevent closing if it's a controlled mandatory dialog
        if (controlledOpen) e.preventDefault();
      }}>
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
                <DialogDescription>This will be used to generate initial instructions and goals for your agent.</DialogDescription>
                <div className="pt-4">
                  <Label htmlFor="description" className="sr-only">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. An assistant that suggests bodyweight workouts and meal plans." className="min-h-[80px]" />
                </div>
              </DialogHeader>
            )}
             {step === 3 && (
              <DialogHeader>
                <DialogTitle>Generated Goals</DialogTitle>
                <DialogDescription>Here are some suggested goals. You can edit them later.</DialogDescription>
                <div className="pt-4 space-y-2">
                  {isSuggesting ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      {goals.map((goal, i) => <li key={i}>{goal}</li>)}
                    </ul>
                  )}
                </div>
              </DialogHeader>
            )}
          </div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              <div className={cn("size-1.5 rounded-full bg-primary", step === 1 ? "bg-primary" : "opacity-20")} />
              <div className={cn("size-1.5 rounded-full bg-primary", step === 2 ? "bg-primary" : "opacity-20")} />
              <div className={cn("size-1.5 rounded-full bg-primary", step === 3 ? "bg-primary" : "opacity-20")} />
            </div>
            <DialogFooter>
              {step < 3 ? (
                <Button className="group" type="button" onClick={handleContinue} disabled={isNextDisabled || isSuggesting}>
                  {isSuggesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Next"}
                  {!isSuggesting && <ArrowRightIcon className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />}
                </Button>
              ) : (
                <Button type="button" onClick={handleCreateAgent} disabled={isCreating}>
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
