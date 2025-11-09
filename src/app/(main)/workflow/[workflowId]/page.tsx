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

export default function WorkflowDetailPage() {
  const [blocks, setBlocks] = useState<string[]>([]);

  const handleAddBlock = (blockType: string) => {
    // For now, only allow one of each block type
    if (!blocks.includes(blockType)) {
      setBlocks((prevBlocks) => [...prevBlocks, blockType]);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col p-6 space-y-6">
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
                {blocks.map((block) => {
                  if (block === 'Trigger') {
                    return (
                      <Card key={block}>
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
                  return null;
                })}
              </div>
            )}
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
