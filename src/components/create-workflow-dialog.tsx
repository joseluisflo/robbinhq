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
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function CreateWorkflowDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const dialogImage = PlaceHolderImages.find((img) => img.id === 'dialog-create-workflow');

  const handleCreateWorkflow = () => {
    // In a real app, you would handle workflow creation here.
    console.log('Creating workflow:', { name });
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
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
              />
            </div>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleCreateWorkflow}
              disabled={!name}
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
