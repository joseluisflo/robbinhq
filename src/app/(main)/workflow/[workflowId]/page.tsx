
'use client';
import '@/app/react-flow.css';
import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddBlockPopover } from '@/components/add-block-popover';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Workflow, WorkflowBlock, Node, Edge } from '@/lib/types';
import { useActiveAgent } from '../../layout';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import ReactFlow, { 
    useNodesState,
    useEdgesState,
    addEdge as rfAddEdge,
    type Connection,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import { ConfigurationPanel } from '@/components/workflow-editor/ConfigurationPanel';
import { FlowCanvas } from '@/components/workflow-editor/FlowCanvas';


function FlowEditor() {
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
  
  const reactFlowInstance = useReactFlow();

  const docRef = useMemo(() => {
    if (!user || !activeAgent?.id || !workflowId) return null;
    return doc(firestore, 'users', user.uid, 'agents', activeAgent.id, 'workflows', workflowId);
  }, [user, firestore, activeAgent?.id, workflowId]);

  
  const handleAddBlock = useCallback((blockType: string) => {
    const newBlock: WorkflowBlock = {
      id: uuidv4(),
      type: blockType,
      params: {},
    };
    
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    
    setNodes((currentNodes) => {
        const addNode = currentNodes.find(n => n.type === 'addBlockNode');
        const lastRealNode = currentNodes.filter(n => n.type !== 'addBlockNode').at(-1);

        const newNode: Node = {
            id: newBlock.id,
            type: 'workflowNode',
            position: { x: lastRealNode?.position.x || 0, y: (lastRealNode?.position.y || -120) + 120 },
            data: { label: blockType, type: blockType },
        };

        const updatedAddNode = addNode ? {
            ...addNode,
            position: { x: newNode.position.x, y: newNode.position.y + 120 }
        } : null;
        
        const otherNodes = currentNodes.filter(n => n.id !== addNode?.id);

        return updatedAddNode ? [...otherNodes, newNode, updatedAddNode] : [...otherNodes, newNode];
    });

    setEdges((currentEdges) => {
        const lastRealNode = nodes.filter(n => n.type !== 'addBlockNode').at(-1);
        
        const newEdge: Edge | null = lastRealNode ? {
            id: `e${lastRealNode.id}-${newBlock.id}`,
            source: lastRealNode.id,
            target: newBlock.id,
        } : null;
        
        const addNodeEdge: Edge = {
            id: `e${newBlock.id}-add`,
            source: newBlock.id,
            target: 'add-block-node'
        }

        const edgesWithoutAdd = currentEdges.filter(e => e.target !== 'add-block-node');
        
        return newEdge ? [...edgesWithoutAdd, newEdge, addNodeEdge] : [...edgesWithoutAdd, addNodeEdge];
    });
  }, [setBlocks, setNodes, setEdges, nodes]);


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

        let initialNodes;
        if (data.nodes && data.nodes.length > 0) {
            initialNodes = data.nodes.map(n => ({...n, type: 'workflowNode'}));
        } else {
            initialNodes = savedBlocks.map((block, index) => ({
                id: block.id,
                type: 'workflowNode',
                position: { x: 0, y: index * 120 },
                data: { label: block.type, type: block.type },
            }));
        }

        const lastNode = initialNodes.at(-1);
        const addNode: Node = {
            id: 'add-block-node',
            type: 'addBlockNode',
            position: { x: lastNode?.position.x || 0, y: (lastNode?.position.y || -120) + 120},
            data: { onAddBlock: handleAddBlock },
        };

        let initialEdges = data.edges || [];
        if (lastNode) {
            initialEdges.push({id: `e${lastNode.id}-add`, source: lastNode.id, target: 'add-block-node'});
        }
        
        setNodes([...initialNodes, addNode]);
        setEdges(initialEdges);

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
  }, [docRef, toast, handleAddBlock]);
  
  const isChanged = useMemo(() => {
    if (!workflow) return false;
    const workflowBlocks = workflow.blocks || [];
    
    const currentNodesToCompare = nodes.filter(n => n.type !== 'addBlockNode').map(({type, data, ...rest}) => rest);
    const currentEdgesToCompare = edges.filter(e => e.target !== 'add-block-node');

    const hasBlockChanges = JSON.stringify(blocks) !== JSON.stringify(workflowBlocks);
    const hasNodeChanges = JSON.stringify(currentNodesToCompare) !== JSON.stringify(workflow.nodes || []);
    const hasEdgeChanges = JSON.stringify(currentEdgesToCompare) !== JSON.stringify(workflow.edges || []);
    
    return hasBlockChanges || hasNodeChanges || hasEdgeChanges;
  }, [blocks, nodes, edges, workflow]);


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
    if (node.type !== 'addBlockNode') {
        setSelectedBlockId(node.id);
    } else {
        setSelectedBlockId(null);
    }
  };


  const handleSaveChanges = () => {
    if (!docRef || !isChanged) return;
    
    startSaving(async () => {
      try {
        const nodesToSave = nodes.filter(n => n.type !== 'addBlockNode').map(({type, data, ...node}) => node);
        const edgesToSave = edges.filter(e => e.target !== 'add-block-node');
        await setDoc(docRef, { blocks, nodes: nodesToSave, edges: edgesToSave, lastModified: serverTimestamp() }, { merge: true });
        toast({ title: 'Success', description: 'Workflow saved successfully.' });
      } catch (error: any) {
        console.error("Error saving workflow: ", error);
        toast({ title: 'Error', description: error.message || 'Could not save workflow.', variant: 'destructive'});
      }
    });
  };

  const handleDiscardChanges = () => {
    if (workflow) {
        const savedBlocks = workflow.blocks || [];
        setBlocks(savedBlocks);
        
        let initialNodes;
        if (workflow.nodes && workflow.nodes.length > 0) {
            initialNodes = workflow.nodes.map(n => ({...n, type: 'workflowNode'}));
        } else {
            initialNodes = savedBlocks.map((block, index) => ({
                id: block.id,
                type: 'workflowNode',
                position: { x: 0, y: index * 120 },
                data: { label: block.type, type: block.type },
            }));
        }

        const lastNode = initialNodes.at(-1);
        const addNode: Node = {
            id: 'add-block-node',
            type: 'addBlockNode',
            position: { x: lastNode?.position.x || 0, y: (lastNode?.position.y || -120) + 120},
            data: { onAddBlock: handleAddBlock },
        };

        let initialEdges = workflow.edges || [];
        if (lastNode) {
            initialEdges.push({id: `e${lastNode.id}-add`, source: lastNode.id, target: 'add-block-node'});
        }
        
        setNodes([...initialNodes, addNode]);
        setEdges(initialEdges);
    }
  };
  
  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (!workflow && !loading && blocks.length === 0) {
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

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

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

export default function WorkflowDetailPage() {
    return (
        <ReactFlowProvider>
            <FlowEditor />
        </ReactFlowProvider>
    )
}
