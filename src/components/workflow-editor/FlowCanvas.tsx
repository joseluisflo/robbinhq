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
      // Give it a brief moment for the layout to settle before fitting the view
      setTimeout(() => {
        reactFlowInstance.fitView({ 
          duration: 300, 
          padding: 0.2,
          maxZoom: 1,
        });
      }, 50);
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
        fitView
        fitViewOptions={{ 
          padding: 0.2,
          maxZoom: 1
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
