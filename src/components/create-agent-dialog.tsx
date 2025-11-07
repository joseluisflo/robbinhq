'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function CreateAgentDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const dialogImage = PlaceHolderImages.find((img) => img.id === 'dialog-create-agent');

  const handleContinue = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };
  
  const handleCreateAgent = () => {
    // In a real app, you would handle agent creation here.
    console.log('Creating agent:', { name, description });
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setStep(1);
        setName('');
        setDescription('');
      }, 200);
    }
  };
  
  const isNextDisabled = step === 1 && !name;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-[425px]">
        {dialogImage && (
            <div className="p-2">
              <Image
                className="w-full rounded-md object-cover h-48"
                src={dialogImage.imageUrl}
                width={382}
                height={216}
                alt={dialogImage.description}
                data-ai-hint={dialogImage.imageHint}
              />
            </div>
        )}
        <div className="space-y-6 px-6 pt-3 pb-6">
          <div className="min-h-[100px]">
            {step === 1 && (
              <DialogHeader>
                <DialogTitle>Give your agent a name</DialogTitle>
                <DialogDescription>
                  This name will be used to identify your agent across the platform.
                </DialogDescription>
                 <div className="pt-4">
                  <Label htmlFor="name" className="sr-only">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fitness Assistant"
                  />
                </div>
              </DialogHeader>
            )}
            {step === 2 && (
               <DialogHeader>
                <DialogTitle>Describe your agent's purpose</DialogTitle>
                <DialogDescription>
                  This will be used to generate initial instructions for your agent in the training section.
                </DialogDescription>
                 <div className="pt-4">
                  <Label htmlFor="description" className="sr-only">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. An assistant that suggests bodyweight workouts and meal plans."
                    className="min-h-[80px]"
                  />
                </div>
              </DialogHeader>
            )}
          </div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
                <div className={cn("size-1.5 rounded-full bg-primary", step === 1 ? "bg-primary" : "opacity-20")}/>
                <div className={cn("size-1.5 rounded-full bg-primary", step === 2 ? "bg-primary" : "opacity-20")}/>
            </div>
            <DialogFooter>
              {step < 2 ? (
                <Button
                  className="group"
                  type="button"
                  onClick={handleContinue}
                  disabled={isNextDisabled}
                >
                  Next
                  <ArrowRightIcon
                    className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <Button type="button" onClick={handleCreateAgent} disabled={!description}>Create Agent</Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
