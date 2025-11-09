'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Info, PlusCircle } from 'lucide-react';
import { AddBlockPopover } from '@/components/add-block-popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

export default function WorkflowDetailPage() {
  const [blocks, setBlocks] = useState<string[]>([]);

  const handleAddBlock = (blockType: string) => {
    // For now, allow adding multiple blocks of the same type.
    // We can add logic to prevent duplicates if needed.
    setBlocks((prevBlocks) => [...prevBlocks, blockType]);
  };

  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
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
                    if (block === 'Trigger') {
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
                    if (block === 'Ask a question') {
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
                    if (block === 'Search web') {
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
                    if (block === 'Condition') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>Condition</CardTitle>
                            <CardDescription>
                              Split the workflow based on a condition.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor={`condition-if-${index}`} className="text-xs font-semibold">IF</Label>
                              <Textarea 
                                id={`condition-if-${index}`}
                                placeholder="e.g. User's message contains 'help'"
                                className="min-h-[80px] mt-1"
                              />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1 space-y-2">
                                <Label className="text-xs font-semibold">THEN</Label>
                                <div className="p-4 bg-muted/50 rounded-lg min-h-[100px] border border-dashed">
                                  <AddBlockPopover onAddBlock={handleAddBlock}>
                                      <Button variant="ghost" size="sm" className="w-full">
                                          <PlusCircle className="mr-2 h-4 w-4" />
                                          Add block
                                      </Button>
                                  </AddBlockPopover>
                                </div>
                              </div>
                              <div className="flex-1 space-y-2">
                                <Label className="text-xs font-semibold">ELSE</Label>
                                <div className="p-4 bg-muted/50 rounded-lg min-h-[100px] border border-dashed">
                                  <AddBlockPopover onAddBlock={handleAddBlock}>
                                      <Button variant="ghost" size="sm" className="w-full">
                                          <PlusCircle className="mr-2 h-4 w-4" />
                                          Add block
                                      </Button>
                                  </AddBlockPopover>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    if (block === 'Loop') {
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle>Loop</CardTitle>
                            <CardDescription>
                              Repeat a set of actions a specific number of times or for each item in a list.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor={`loop-condition-${index}`} className="text-xs font-semibold">REPEAT</Label>
                              <Textarea 
                                id={`loop-condition-${index}`}
                                placeholder="e.g. 5 times, or 'For each customer in leads list'"
                                className="min-h-[80px] mt-1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold">DO</Label>
                              <div className="p-4 bg-muted/50 rounded-lg min-h-[100px] border border-dashed">
                                <AddBlockPopover onAddBlock={handleAddBlock}>
                                  <Button variant="ghost" size="sm" className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add block
                                  </Button>
                                </AddBlockPopover>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    if (block === 'Set variable') {
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
                    return null;
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
              <Button variant="ghost">Discard changes</Button>
              <Button>Save changes</Button>
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
