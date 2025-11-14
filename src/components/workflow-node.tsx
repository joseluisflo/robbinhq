
'use client';

import { cn } from '@/lib/utils';
import { Play, Wrench, GitFork, Database } from 'lucide-react';
import { Handle, Position, type NodeProps } from 'reactflow';

const blockGroups: Record<string, string> = {
    "Trigger": "Core",
    "Ask a question": "Tools",
    "Wait for User Reply": "Tools",
    "Show Multiple Choice": "Tools",
    "Search web": "Tools",
    "Send Email": "Tools",
    "Send SMS": "Tools",
    "Create PDF": "Tools",
    "Condition": "Logic",
    "Loop": "Logic",
    "Set variable": "Data",
};

const groupIcons: Record<string, React.ElementType> = {
    Core: Play,
    Tools: Wrench,
    Logic: GitFork,
    Data: Database,
};

const groupColors: Record<string, string> = {
    Core: 'bg-green-100 text-green-700',
    Tools: 'bg-blue-100 text-blue-700',
    Logic: 'bg-purple-100 text-purple-700',
    Data: 'bg-orange-100 text-orange-700',
};


export function WorkflowNode({ data, selected }: NodeProps<{ label: string; type: string }>) {
  const group = blockGroups[data.type] || 'Tools';
  const Icon = groupIcons[group] || Wrench;
  const colorClass = groupColors[group] || groupColors.Tools;
  const label = data.type === 'Trigger' ? 'Start' : data.label;

  return (
    <div
      className={cn(
        'w-48 rounded-2xl border-2 bg-background p-3 shadow-md transition-all',
        selected ? 'border-primary shadow-lg' : 'border-border'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}
