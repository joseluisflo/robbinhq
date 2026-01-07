'use client';
import '@/app/react-flow.css';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddBlockPopover } from '@/components/add-block-popover';
import { ConfigurationPanel } from '@/components/workflow-editor/ConfigurationPanel';
import { FlowCanvas } from '@/components/workflow-editor/FlowCanvas';
import { useWorkflowEditor } from '@/hooks/use-workflow-editor';

export function FlowEditor() {
  const params = useParams();
  const workflowId = params.workflowId as string;

  const {
    workflow,
    blocks,
    loading,
    isSaving,
    isChanged,
    nodes,
    edges,
    selectedBlock,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleNodeClick,
    handleAddBlock,
    handleBlockParamChange,
    handleSaveChanges,
    handleDiscardChanges,
  } = useWorkflowEditor(workflowId);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (!workflow && !loading) {
      return (
         <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="text-center">
              <p className="font-semibold">Empty Workflow</p>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by adding your first block.
              </p>
               <AddBlockPopover onAddBlock={handleAddBlock}>
                  <Button variant="secondary" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add block
                  </Button>
              </AddBlockPopover>
            </div>
        </div>
      );
  }

  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <ConfigurationPanel
            selectedBlock={selectedBlock}
            handleBlockParamChange={handleBlockParamChange}
            onAddBlock={handleAddBlock}
            isSaving={isSaving}
            isChanged={isChanged}
            handleSaveChanges={handleSaveChanges}
            handleDiscardChanges={handleDiscardChanges}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview/Canvas Panel */}
        <ResizablePanel defaultSize={65} minSize={30}>
            <FlowCanvas 
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
            />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
