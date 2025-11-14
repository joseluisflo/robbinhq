'use client';
import { AddBlockPopover } from '@/components/add-block-popover';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Handle, Position, type NodeProps } from 'reactflow';

export function AddBlockNode({ data }: NodeProps<{ onAddBlock: (blockType: string) => void }>) {
  return (
    <>
      <AddBlockPopover onAddBlock={data.onAddBlock}>
        <button className="w-48 rounded-lg border bg-background p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'bg-gray-100 text-gray-700'
              )}
            >
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Add block
            </span>
          </div>
        </button>
      </AddBlockPopover>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !-top-1 !bg-primary"
      />
    </>
  );
}
