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

interface AddStarterDialogProps {
  children: React.ReactNode;
  onAddStarter: (starter: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
}

export function AddStarterDialog({
  children,
  onAddStarter,
  title = 'Add conversation starter',
  description = 'Add a prompt to suggest to users at the start of a conversation.',
  placeholder = 'e.g. How do I get started?',
}: AddStarterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [starter, setStarter] = useState('');

  const handleAdd = () => {
    if (starter.trim()) {
      onAddStarter(starter.trim());
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStarter('');
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="starter-text">
              Rule
            </Label>
            <Input
              id="starter-text"
              value={starter}
              onChange={(e) => setStarter(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!starter.trim()}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
