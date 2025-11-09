'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Info, PlusCircle } from 'lucide-react';
import { AddBlockPopover } from '@/components/add-block-popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function WorkflowDetailPage() {
  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>When to use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger-description" className="text-sm font-normal text-muted-foreground">
                    Explain when the AI Agent should use this action. Include a description of what this action does, the data it provides, and any updates it makes. Include example queries that should trigger this action.
                  </Label>
                  <Textarea
                    id="trigger-description"
                    placeholder="Example: Use this action to retrieve the user's invoice history. Example queries: 'Show me my invoice history', 'What are my invoices?'..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Blocks
                <Info className="h-4 w-4 text-muted-foreground" />
              </h3>
              <AddBlockPopover>
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AddBlockPopover>
            </div>
            <Card className="text-center flex-1 flex flex-col justify-center border-dashed">
              <CardContent className="p-12">
                <p className="font-semibold">No block added yet</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Add block to start to build your workflow
                </p>
                <AddBlockPopover>
                  <Button variant="secondary" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add block
                  </Button>
                </AddBlockPopover>
              </CardContent>
            </Card>
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
