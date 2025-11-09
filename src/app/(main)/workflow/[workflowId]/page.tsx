'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Info, PlusCircle } from 'lucide-react';
import { AddBlockPopover } from '@/components/add-block-popover';

export default function WorkflowDetailPage() {
  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between mb-4">
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
