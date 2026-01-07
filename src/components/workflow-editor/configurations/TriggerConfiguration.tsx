'use client';

import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BlockConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
}

export function TriggerConfiguration({ selectedBlock, handleBlockParamChange }: BlockConfigurationProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">When to use</h4>
        <p className="text-sm text-muted-foreground">
          Describe when the agent should use this workflow. Be
          specific and descriptive.
        </p>
      </div>
      <div>
        <Label
          htmlFor={`trigger-description-${selectedBlock.id}`}
          className="sr-only"
        >
          When to use description
        </Label>
        <Textarea
          id={`trigger-description-${selectedBlock.id}`}
          placeholder="e.g. When the user asks to create a new marketing campaign..."
          className="min-h-[100px]"
          value={selectedBlock.params.description || ''}
          onChange={(e) =>
            handleBlockParamChange(
              selectedBlock.id,
              'description',
              e.target.value
            )
          }
        />
      </div>
    </div>
  );
}
