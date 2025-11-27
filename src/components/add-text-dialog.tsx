'use client';

import { useState, useTransition, useMemo } from 'react';
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
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addAgentText } from '@/app/actions/texts';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useKnowledgeUsage } from '@/hooks/use-knowledge-usage';
import { collection, query } from 'firebase/firestore';
import type { TextSource, AgentFile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function AddTextDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, startSaving] = useTransition();

  const { activeAgent, userProfile } = useActiveAgent();
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  // --- Knowledge Usage ---
  const textsQuery = query(collection(firestore, 'users', user!.uid, 'agents', activeAgent!.id!, 'texts'));
  const { data: textSources } = useCollection<TextSource>(textsQuery);
  const filesQuery = query(collection(firestore, 'users', user!.uid, 'agents', activeAgent!.id!, 'files'));
  const { data: fileSources } = useCollection<AgentFile>(filesQuery);
  const { currentUsageKB, usageLimitKB, isLimitReached } = useKnowledgeUsage(textSources, fileSources, userProfile);
  // --- End Knowledge Usage ---


  const handleAddText = async () => {
    if (!user || !activeAgent?.id || !title || !content) return;
    
    const newContentSizeKB = new Blob([content]).size / 1024;
    if (currentUsageKB + newContentSizeKB > usageLimitKB) {
        toast({
            title: 'Storage limit exceeded',
            description: "Adding this text would exceed your plan's storage limit.",
            variant: 'destructive',
        });
        return;
    }

    startSaving(async () => {
        const result = await addAgentText(user.uid, activeAgent.id!, { title, content });
        if ('error' in result) {
            toast({ title: 'Failed to add text', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Text added successfully!' });
            setIsOpen(false);
        }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setTitle('');
        setContent('');
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add text</DialogTitle>
          <DialogDescription>
            Train your AI Agent with clear, text-based data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLimitReached && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Storage Limit Reached</AlertTitle>
                <AlertDescription>
                    You have reached your plan's storage limit. Please upgrade or remove existing sources to add more text.
                </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Return Policy"
              disabled={isLimitReached}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
              placeholder="Enter your text content here."
              disabled={isLimitReached}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleAddText}
            disabled={!title || !content || isSaving || isLimitReached}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
