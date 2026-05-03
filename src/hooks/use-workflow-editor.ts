'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { notFound } from 'next/navigation';
import type { Workflow, WorkflowBlock, Node, Edge } from '@/lib/types';
import { useActiveAgent } from '@/app/(main)/layout';
import { useToast } from '@/hooks/use-toast';
import { getWorkflow, updateWorkflowDefinition } from '@/app/actions/workflow';
import {
    useNodesState,
    useEdgesState,
    addEdge as rfAddEdge,
    type Connection,
    type OnNodesChange,
} from 'reactflow';

const generateShortId = () => {
  return Math.random().toString(36).substring(2, 6);
};


export function useWorkflowEditor(workflowId: string) {
  const { activeAgent, setWorkflowName, setCurrentTestBlocks } = useActiveAgent();
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => rfAddEdge(params, eds)), [setEdges]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const agentId = activeAgent?.id ?? null;
  const canLoad = Boolean(agentId && workflowId);

  const handleAddBlock = useCallback((blockType: string) => {
    const newBlock: WorkflowBlock = {
        id: generateShortId(),
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
        const previousEdge = currentEdges.find(e => e.target === 'add-block-node');
        const lastRealNodeId = previousEdge?.source;

        const edgesWithoutAdd = currentEdges.filter(e => e.target !== 'add-block-node');

        const newEdges: Edge[] = [];

        if (lastRealNodeId) {
            newEdges.push({
                id: `e-${lastRealNodeId}-${newBlock.id}`,
                source: lastRealNodeId,
                target: newBlock.id,
            });
        }

        newEdges.push({
            id: `e-${newBlock.id}-add`,
            source: newBlock.id,
            target: 'add-block-node',
        });

        return [...edgesWithoutAdd, ...newEdges];
    });
}, [setBlocks, setNodes, setEdges]);


  const applyWorkflowToEditor = useCallback((data: Workflow) => {
    setWorkflow(data);
    setWorkflowName(data.name);
    const savedBlocks = data.blocks || [];
    setBlocks(savedBlocks);
    setCurrentTestBlocks(savedBlocks);

    let initialNodes: Node[] = [];
    if (data.nodes && data.nodes.length > 0) {
        initialNodes = data.nodes.map(n => ({...n, type: 'workflowNode', data: { ...n.data, label: n.data.label || n.data.type }}));
    } else if (savedBlocks.length > 0) {
        initialNodes = savedBlocks.map((block, index) => ({
            id: block.id,
            type: 'workflowNode',
            position: { x: 0, y: index * 120 },
            data: { label: block.type, type: block.type },
        }));
    } else {
         const triggerBlock = { id: generateShortId(), type: 'Trigger', params: {} };
         setBlocks([triggerBlock]);
         initialNodes = [{
             id: triggerBlock.id,
             type: 'workflowNode',
             position: { x: 0, y: 0 },
             data: { label: 'Start', type: 'Trigger' },
         }];
    }

    const lastNode = initialNodes.length > 0 ? initialNodes[initialNodes.length - 1] : null;

    const addNode: Node = {
        id: 'add-block-node',
        type: 'addBlockNode',
        position: { x: lastNode?.position.x ?? 0, y: (lastNode?.position.y ?? -120) + 120},
        data: { onAddBlock: handleAddBlock },
    };

    const nodesWithAdd = [...initialNodes, addNode];
    setNodes(nodesWithAdd);

    let initialEdges = data.edges || [];
    if (initialEdges.length === 0 && savedBlocks.length > 0) {
      for (let i = 0; i < savedBlocks.length - 1; i++) {
          initialEdges.push({id: `e-${savedBlocks[i].id}-${savedBlocks[i+1].id}`, source: savedBlocks[i].id, target: savedBlocks[i+1].id});
      }
    }

    const finalEdges = [...initialEdges.filter(e => e.target !== 'add-block-node')];
    if (lastNode) {
      finalEdges.push({id: `e-${lastNode.id}-add`, source: lastNode.id, target: 'add-block-node'});
    }

    setEdges(finalEdges);
  }, [setWorkflowName, setCurrentTestBlocks, handleAddBlock, setNodes, setEdges]);


  useEffect(() => {
    if (!canLoad || !agentId) {
      if (activeAgent) setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getWorkflow(agentId, workflowId)
      .then((result) => {
        if (cancelled) return;
        if ('error' in result) {
          toast({ title: 'Error', description: result.error || 'Could not load workflow.', variant: 'destructive' });
          setWorkflow(null);
          notFound();
          return;
        }
        applyWorkflowToEditor(result.workflow);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error fetching workflow:', error);
        toast({ title: 'Error', description: 'Could not load workflow.', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      setWorkflowName(null);
    };
  }, [canLoad, agentId, workflowId, applyWorkflowToEditor, toast, activeAgent, setWorkflowName]);

  useEffect(() => {
    setCurrentTestBlocks(blocks);
  }, [blocks, setCurrentTestBlocks]);

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

  const handleNodesChange: OnNodesChange = (changes) => {
    onNodesChange(changes);
    for (const change of changes) {
        if (change.type === 'remove') {
            setBlocks((prevBlocks) => prevBlocks.filter(block => block.id !== change.id));
        }
    }
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
    if (node.type !== 'addBlockNode') {
        setSelectedBlockId(node.id);
    } else {
        setSelectedBlockId(null);
    }
  };


  const handleSaveChanges = () => {
    if (!agentId || !workflowId || !isChanged) return;

    startSaving(async () => {
      try {
        const nodesToSave = nodes
          .filter(n => n.type !== 'addBlockNode')
          .map(({type, ...node}) => ({...node, data: {label: node.data.label, type: node.data.type}}));
        const edgesToSave = edges.filter(e => e.target !== 'add-block-node');

        const result = await updateWorkflowDefinition(agentId, workflowId, {
          blocks,
          nodes: nodesToSave as Node[],
          edges: edgesToSave as Edge[],
        });
        if ('error' in result) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
          return;
        }
        setWorkflow(result.workflow);
        toast({ title: 'Success', description: 'Workflow saved successfully.' });
      } catch (error: any) {
        console.error('Error saving workflow: ', error);
        toast({ title: 'Error', description: error.message || 'Could not save workflow.', variant: 'destructive' });
      }
    });
  };

  const handleDiscardChanges = () => {
    if (workflow) {
        const savedBlocks = workflow.blocks || [];
        setBlocks(savedBlocks);

        let initialNodes: Node[];
        if (workflow.nodes && workflow.nodes.length > 0) {
            initialNodes = workflow.nodes.map(n => ({...n, type: 'workflowNode', data: {...n.data, label: n.data.label || n.data.type}}));
        } else if (savedBlocks.length > 0) {
            initialNodes = savedBlocks.map((block, index) => ({
                id: block.id,
                type: 'workflowNode',
                position: { x: 0, y: index * 120 },
                data: { label: block.type, type: block.type },
            }));
        } else {
           const triggerBlock = { id: generateShortId(), type: 'Trigger', params: {} };
           setBlocks([triggerBlock]);
           initialNodes = [{
               id: triggerBlock.id,
               type: 'workflowNode',
               position: { x: 0, y: 0 },
               data: { label: 'Start', type: 'Trigger' },
           }];
        }

        const lastNode = initialNodes.length > 0 ? initialNodes[initialNodes.length - 1] : null;
        const addNode: Node = {
            id: 'add-block-node',
            type: 'addBlockNode',
            position: { x: lastNode?.position.x ?? 0, y: (lastNode?.position.y ?? -120) + 120},
            data: { onAddBlock: handleAddBlock },
        };

        const nodesWithAdd = [...initialNodes, addNode];
        setNodes(nodesWithAdd);

        let initialEdges = workflow.edges || [];
        if (initialEdges.length === 0 && savedBlocks.length > 0) {
            for (let i = 0; i < savedBlocks.length - 1; i++) {
                initialEdges.push({id: `e-${savedBlocks[i].id}-${savedBlocks[i+1].id}`, source: savedBlocks[i].id, target: savedBlocks[i+1].id});
            }
        }

        const finalEdges = [...initialEdges.filter(e => e.target !== 'add-block-node')];
        if (lastNode) {
          finalEdges.push({id: `e-${lastNode.id}-add`, source: lastNode.id, target: 'add-block-node'});
        }

        setEdges(finalEdges);
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
    onNodesChange: handleNodesChange,
    onEdgesChange,
    onConnect,
    handleNodeClick,
    handleAddBlock,
    handleBlockParamChange,
    handleSaveChanges,
    handleDiscardChanges,
  };
}
