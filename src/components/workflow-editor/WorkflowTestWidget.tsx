'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatWidgetPublic } from '@/components/chat-widget-public';
import type { Agent } from '@/lib/types';
import { useActiveAgent } from '@/app/(main)/layout';
import { useParams } from 'next/navigation';

interface WorkflowTestWidgetProps {
  agent: Agent;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function WorkflowTestWidget({ agent, isOpen, onOpenChange }: WorkflowTestWidgetProps) {
  const { currentTestBlocks } = useActiveAgent();
  const params = useParams();
  const workflowId = params.workflowId as string;

  if (!isOpen) return null;
  
  const workflowOverride = currentTestBlocks ? {
      workflowId,
      blocks: currentTestBlocks,
  } : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 w-[400px] h-[650px] overflow-hidden !rounded-2xl shadow-2xl">
        <ChatWidgetPublic 
            agent={agent}
            workflowOverride={workflowOverride}
        />
      </DialogContent>
    </Dialog>
  );
}
