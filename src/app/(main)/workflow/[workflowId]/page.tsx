'use client';
import '@/app/react-flow.css';
import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
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
import type { Workflow, WorkflowBlock, Node, Edge } from '@/lib/types';
import { useActiveAgent } from '../../layout';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import ReactFlow, { 
    Background, 
    Controls,
    useNodesState,
    useEdgesState,
    addEdge as rfAddEdge,
    type Connection,
    type Edge as RfEdge,
} from 'reactflow';
import { WorkflowNode } from '@/components/workflow-node';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => rfAddEdge(params, eds)), [setEdges]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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
        const savedBlocks = data.blocks || [];
        setBlocks(savedBlocks);

        if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes.map(n => ({...n, type: 'workflowNode'})));
        } else {
            const initialNodes = savedBlocks.map((block, index) => ({
                id: block.id,
                type: 'workflowNode',
                position: { x: 250, y: 100 * index },
                data: { label: block.type, type: block.type },
            }));
            setNodes(initialNodes);
        }
        setEdges(data.edges || []);

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
  }, [docRef, toast, setNodes, setEdges]);
  
  const isChanged = useMemo(() => {
    if (!workflow) return false;
    // Compare current state with the initial state from Firestore
    const workflowBlocks = workflow.blocks || [];
    const workflowNodes = (workflow.nodes || []).map(n => ({...n, type: 'workflowNode'}));
    const workflowEdges = workflow.edges || [];

    const hasBlockChanges = JSON.stringify(blocks) !== JSON.stringify(workflowBlocks);
    const hasNodeChanges = JSON.stringify(nodes) !== JSON.stringify(workflowNodes);
    const hasEdgeChanges = JSON.stringify(edges) !== JSON.stringify(workflowEdges);
    
    return hasBlockChanges || hasNodeChanges || hasEdgeChanges;
  }, [blocks, nodes, edges, workflow]);


  const handleAddBlock = (blockType: string) => {
    const newBlock: WorkflowBlock = {
      id: uuidv4(),
      type: blockType,
      params: {},
    };
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    
    const newNode: Node = {
        id: newBlock.id,
        type: 'workflowNode',
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: { label: blockType, type: blockType },
    };
    setNodes((nds) => [...nds, newNode]);
  };
  
  const handleBlockParamChange = (blockId: string, paramName: string, value: any) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId
          ? { ...block, params: { ...block.params, [paramName]: value } }
          : block
      )
    );
  };
  
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedBlockId(node.id);
  };


  const handleSaveChanges = () => {
    if (!docRef || !isChanged) return;
    
    startSaving(async () => {
      try {
        const nodesToSave = nodes.map(({type, ...node}) => node);
        await setDoc(docRef, { blocks, nodes: nodesToSave, edges, lastModified: serverTimestamp() }, { merge: true });
        toast({ title: 'Success', description: 'Workflow saved successfully.' });
      } catch (error: any) {
        console.error("Error saving workflow: ", error);
        toast({ title: 'Error', description: error.message || 'Could not save workflow.', variant: 'destructive'});
      }
    });
  };

  const handleDiscardChanges = () => {
    if (workflow) {
        setBlocks(workflow.blocks || []);
        setNodes((workflow.nodes || []).map(n => ({...n, type: 'workflowNode'})));
        setEdges(workflow.edges || []);
    }
  };
  
  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (!workflow) {
    return notFound();
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="flex h-full flex-col">
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold">{workflow.name}</h2>
                <p className="text-sm text-muted-foreground">Design and configure your agent's workflow.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Blocks
                </h3>
                <AddBlockPopover onAddBlock={handleAddBlock}>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </AddBlockPopover>
              </div>

              {!selectedBlockId ? (
                <div className="text-center text-muted-foreground pt-12">
                  <p>Select a block from the canvas to configure it.</p>
                </div>
              ) : selectedBlock ? (
                <div>
                 {selectedBlock.type === 'Trigger' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>When to use</CardTitle>
                        <CardDescription>
                          Describe when the agent should use this workflow. Be specific and descriptive.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>
                            <Label htmlFor={`trigger-description-${selectedBlock.id}`} className="sr-only">When to use description</Label>
                            <Textarea 
                              id={`trigger-description-${selectedBlock.id}`}
                              placeholder="e.g. When the user asks to create a new marketing campaign..."
                              className="min-h-[100px]"
                              value={selectedBlock.params.description || ''}
                              onChange={(e) => handleBlockParamChange(selectedBlock.id, 'description', e.target.value)}
                            />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedBlock.type === 'Ask a question' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Ask a question</CardTitle>
                        <CardDescription>
                          Prompt the user for specific information.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>
                            <Label htmlFor={`ask-a-question-prompt-${selectedBlock.id}`} className="sr-only">Question to ask</Label>
                            <Textarea 
                              id={`ask-a-question-prompt-${selectedBlock.id}`}
                              placeholder="e.g. What is your email address?"
                              className="min-h-[100px]"
                              value={selectedBlock.params.prompt || ''}
                              onChange={(e) => handleBlockParamChange(selectedBlock.id, 'prompt', e.target.value)}
                            />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedBlock.type === 'Search web' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Search web</CardTitle>
                        <CardDescription>
                          Define what the agent should search for on the internet.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>
                            <Label htmlFor={`search-web-query-${selectedBlock.id}`} className="sr-only">Search query</Label>
                            <Textarea 
                              id={`search-web-query-${selectedBlock.id}`}
                              placeholder="e.g. Latest trends in AI development"
                              className="min-h-[100px]"
                              value={selectedBlock.params.query || ''}
                              onChange={(e) => handleBlockParamChange(selectedBlock.id, 'query', e.target.value)}
                            />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                    {selectedBlock.type === 'Set variable' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Set variable</CardTitle>
                        <CardDescription>
                          Store a value in a variable to use later in the workflow.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className='grid grid-cols-2 gap-4'>
                          <div className="space-y-2">
                            <Label htmlFor={`variable-name-${selectedBlock.id}`}>Variable Name</Label>
                            <Input 
                              id={`variable-name-${selectedBlock.id}`} 
                              placeholder="e.g. userEmail"
                              value={selectedBlock.params.variableName || ''}
                              onChange={(e) => handleBlockParamChange(selectedBlock.id, 'variableName', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`variable-value-${selectedBlock.id}`}>Value</Label>
                            <Input 
                              id={`variable-value-${selectedBlock.id}`} 
                              placeholder="e.g. '{{answer_from_previous_step}}' "
                              value={selectedBlock.params.value || ''}
                              onChange={(e) => handleBlockParamChange(selectedBlock.id, 'value', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedBlock.type === 'Send Email' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Send Email</CardTitle>
                        <CardDescription>
                          Send an email to a specified recipient.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`email-to-${selectedBlock.id}`}>To</Label>
                          <Input 
                            id={`email-to-${selectedBlock.id}`} 
                            placeholder="recipient@example.com or {{variableName}}"
                            value={selectedBlock.params.to || ''}
                            onChange={(e) => handleBlockParamChange(selectedBlock.id, 'to', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-subject-${selectedBlock.id}`}>Subject</Label>
                          <Input 
                            id={`email-subject-${selectedBlock.id}`} 
                            placeholder="Your email subject"
                            value={selectedBlock.params.subject || ''}
                            onChange={(e) => handleBlockParamChange(selectedBlock.id, 'subject', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-body-${selectedBlock.id}`}>Body</Label>
                          <Textarea 
                            id={`email-body-${selectedBlock.id}`} 
                            placeholder="Write your email content here." 
                            className="min-h-[120px]"
                            value={selectedBlock.params.body || ''}
                            onChange={(e) => handleBlockParamChange(selectedBlock.id, 'body', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground pt-12">
                  <p>Block not found. It might have been deleted.</p>
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
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="flex h-full items-center justify-center bg-muted/30">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                proOptions={{ hideAttribution: true }}
            >
                <Background />
                <Controls />
            </ReactFlow>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
