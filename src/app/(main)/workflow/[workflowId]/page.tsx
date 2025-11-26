'use client';
import { ReactFlowProvider } from 'reactflow';
import { FlowEditor } from '@/components/workflow-editor/FlowEditor';

export default function WorkflowDetailPage() {
    return (
        <ReactFlowProvider>
            <FlowEditor />
        </ReactFlowProvider>
    )
}
