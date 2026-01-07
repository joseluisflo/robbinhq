'use client';
import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import { nodeTypes } from '@/components/workflow/nodes';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Edge | Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: FlowCanvasProps) {
  const reactFlowInstance = useReactFlow();

  React.useEffect(() => {
    if (nodes.length > 0) {
      // Ajustamos esto para que sea consistente con la vista inicial
      reactFlowInstance.fitView({ 
        duration: 300, 
        padding: 0.2, 
        maxZoom: 1,    // Evita que se haga zoom in excesivo
        minZoom: 0.3     
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  return (
    <div className="flex h-full items-center justify-center bg-muted/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        // --- AQUÍ ESTÁ EL CAMBIO PRINCIPAL ---
        fitView
        fitViewOptions={{ 
          padding: 0.2, // Deja un margen agradable
          maxZoom: 1    // IMPORTANTE: Esto evita que el nodo se vea gigante al inicio
        }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  );
}