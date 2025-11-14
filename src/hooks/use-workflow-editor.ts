
'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Workflow, WorkflowBlock, Node, Edge } from '@/lib/types';
import { useActiveAgent } from '@/app/(main)/layout';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
    useNodesState,
    useEdgesState,
    addEdge as rfAddEdge,
    type Connection,
} from 'reactflow';

export function useWorkflowEditor(workflowId: string) {
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

  
  const handleAddBlock = useCallback((blockType: string) => {
    const newBlock: WorkflowBlock = {
        id: uuidv4(),
        type: blockType,
        params: {},
    };

    setBlocks(prevBlocks => [...prevBlocks, newBlock]);

    setNodes(currentNodes => {
        const lastRealNode = currentNodes.filter(n => n.type !== 'addBlockNode').pop();
        const addNode = currentNodes.find(n => n.type === 'addBlockNode');

        const newNode: Node = {
            id: newBlock.id,
            type: 'workflowNode',
            position: { x: lastRealNode?.position.x ?? 0, y: (lastRealNode?.position.y ?? -120) + 120 },
            data: { label: blockType, type: blockType },
        };

        const updatedAddNode = addNode ? { ...addNode, position: { x: newNode.position.x, y: newNode.position.y + 120 } } : null;

        const otherNodes = currentNodes.filter(n => n.id !== 'add-block-node');
        
        return updatedAddNode ? [...otherNodes, newNode, updatedAddNode] : [...otherNodes, newNode];
    });

    setEdges(currentEdges => {
        // Find the node that currently connects TO the 'add-block-node'. That's our last real node.
        const previousEdge = currentEdges.find(e => e.target === 'add-block-node');
        const lastRealNodeId = previousEdge?.source;

        // Remove the old connection to the add-block-node
        const edgesWithoutAdd = currentEdges.filter(e => e.target !== 'add-block-node');

        const newEdges: Edge[] = [];

        // Connect the last real node to our new block
        if (lastRealNodeId) {
            newEdges.push({
                id: `e-${lastRealNodeId}-${newBlock.id}`,
                source: lastRealNodeId,
                target: newBlock.id,
            });
        }
        
        // Connect our new block to the add-block-node
        newEdges.push({
            id: `e-${newBlock.id}-add`,
            source: newBlock.id,
            target: 'add-block-node',
        });
        
        return [...edgesWithoutAdd, ...newEdges];
    });
}, [setBlocks, setNodes, setEdges]);


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
            initialNodes = data.nodes.map(n => ({...n, type: 'workflowNode', data: { ...n.data, label: n.data.label || n.data.type }}));
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
  }, [docRef, toast, handleAddBlock, setNodes, setEdges, user, activeAgent]);
  
  const isChanged = useMemo(() => {
    if (!workflow) return false;
    const workflowBlocks = workflow.blocks || [];
    
    const currentNodesToCompare = nodes.filter(n => n.type !== 'addBlockNode').map(({type, ...rest}) => ({...rest, data: {label: rest.data.label, type: rest.data.type}}));
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
        const nodesToSave = nodes.filter(n => n.type !== 'addBlockNode').map(({type, ...node}) => ({...node, data: {label: node.data.label, type: node.data.type}}));
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
            initialNodes = workflow.nodes.map(n => ({...n, type: 'workflowNode', data: {...n.data, label: n.data.label || n.data.type}}));
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

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return {
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
  };
}
