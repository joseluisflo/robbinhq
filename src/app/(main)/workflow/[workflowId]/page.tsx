'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Info, PlusCircle, Loader2 } from 'lucide-react';
import { AddBlockPopover } from '@/components/add-block-popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Workflow, WorkflowBlock } from '@/lib/types';
import { useActiveAgent } from '../../layout';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<WorkflowBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();

  const docRef = useMemo(() => {
    if (!user || !activeAgent?.id || !workflowId) return null;
    return doc(firestore, 'users', user.uid, 'agents', activeAgent.id, 'workflows', workflowId);
  }, [user, firestore, activeAgent?.id, workflowId]);

  useEffect(() => {
    if (!docRef) {
      if (user && activeAgent) setLoading(false);
      return;
    };

    setLoading(true);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Workflow;
        setWorkflow({ ...data, id: docSnap.id });
        const loadedBlocks = data.blocks || [];
        setBlocks(loadedBlocks);
        setInitialBlocks(loadedBlocks);
      } else {
        setWorkflow(null);
        notFound();
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workflow:", error);
      toast({ title: 'Error', description: 'Could not load workflow.', variant: 'destructive'});
      setLoading(false);
    });

    return () => unsubscribe();
  }, [docRef, toast]);
  
  const isChanged = useMemo(() => JSON.stringify(blocks) !== JSON.stringify(initialBlocks), [blocks, initialBlocks]);

  const handleAddBlock = (blockType: string) => {
    const newBlock: WorkflowBlock = {
      id: uuidv4(),
      type: blockType,
      params: {},
    };
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  };

  const handleSaveChanges = () => {
    if (!docRef || !isChanged) return;
    
    startSaving(async () => {
      try {
        await setDoc(docRef, { blocks, lastModified: serverTimestamp() }, { merge: true });
        toast({ title: 'Success', description: 'Workflow saved successfully.' });
      } catch (error: any) {
        console.error("Error saving workflow: ", error);
        toast({ title: 'Error', description: error.message || 'Could not save workflow.', variant: 'destructive'});
      }
    });
  };

  const handleDiscardChanges = () => {
    setBlocks(initialBlocks);
  };
  
  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (!workflow) {
    return notFound();
  }

  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold">{workflow.name}</h2>
                <p className="text-sm text-muted-foreground">Design and configure your agent's workflow.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Blocks
                  <Info className="h-4 w-4 text-muted-foreground" />
                </h3>
                <AddBlockPopover onAddBlock={handleAddBlock}>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </AddBlockPopover>
              </div>

              {blocks.length === 0 ? (
                <Card className="text-center flex-1 flex flex-col justify-center border-dashed">
                  <CardContent className="p-12">
                    <p className="font-semibold">No block added yet</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                      Add block to start to build your workflow
                    </p>
                    <AddBlockPopover onAddBlock={handleAddBlock}>
                      <Button variant="secondary" className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add block
                      </Button>
                    </AddBlockPopover>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, index) => {
                    // This is a placeholder for actual block components
                    // In a real app, you'd have a component for each block type
                    // and manage their state properly.
                    if (block.type === 'Trigger') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>When to use</CardTitle>
                            <CardDescription>
                              Describe when the agent should use this workflow. Be specific and descriptive.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div>
                                <Label htmlFor="trigger-description" className="sr-only">When to use description</Label>
                                <Textarea 
                                  id="trigger-description"
                                  placeholder="e.g. When the user asks to create a new marketing campaign..."
                                  className="min-h-[100px]"
                                />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    if (block.type === 'Ask a question') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>Ask a question</CardTitle>
                            <CardDescription>
                              Prompt the user for specific information.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div>
                                <Label htmlFor={`ask-a-question-prompt-${index}`} className="sr-only">Question to ask</Label>
                                <Textarea 
                                  id={`ask-a-question-prompt-${index}`}
                                  placeholder="e.g. What is your email address?"
                                  className="min-h-[100px]"
                                />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    if (block.type === 'Search web') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>Search web</CardTitle>
                            <CardDescription>
                              Define what the agent should search for on the internet.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div>
                                <Label htmlFor={`search-web-query-${index}`} className="sr-only">Search query</Label>
                                <Textarea 
                                  id={`search-web-query-${index}`}
                                  placeholder="e.g. Latest trends in AI development"
                                  className="min-h-[100px]"
                                />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                     if (block.type === 'Set variable') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>Set variable</CardTitle>
                            <CardDescription>
                              Store a value in a variable to use later in the workflow.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className='grid grid-cols-2 gap-4'>
                              <div className="space-y-2">
                                <Label htmlFor={`variable-name-${index}`}>Variable Name</Label>
                                <Input id={`variable-name-${index}`} placeholder="e.g. userEmail" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`variable-value-${index}`}>Value</Label>
                                <Input id={`variable-value-${index}`} placeholder="e.g. '{{answer_from_previous_step}}' " />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    if (block.type === 'Send Email') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>Send Email</CardTitle>
                            <CardDescription>
                              Send an email to a specified recipient.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`email-to-${index}`}>To</Label>
                              <Input id={`email-to-${index}`} placeholder="recipient@example.com" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`email-subject-${index}`}>Subject</Label>
                              <Input id={`email-subject-${index}`} placeholder="Your email subject" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`email-body-${index}`}>Body</Label>
                              <Textarea id={`email-body-${index}`} placeholder="Write your email content here." className="min-h-[120px]" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    // Render other block types here...
                    return <Card key={index}><CardHeader><CardTitle>{block.type}</CardTitle></CardHeader></Card>;
                  })}
                  <AddBlockPopover onAddBlock={handleAddBlock}>
                      <Button variant="outline" className="w-full">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add block
                      </Button>
                  </AddBlockPopover>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-background">
              <Button variant="ghost" onClick={handleDiscardChanges} disabled={!isChanged || isSaving}>Discard changes</Button>
              <Button onClick={handleSaveChanges} disabled={!isChanged || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview/Canvas Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full items-center justify-center p-6 bg-muted/30">
            <span className="font-semibold">Preview/Canvas Panel</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
