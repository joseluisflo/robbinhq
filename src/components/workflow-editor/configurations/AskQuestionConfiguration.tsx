'use client';

import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BlockConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
}

export function AskQuestionConfiguration({ selectedBlock, handleBlockParamChange }: BlockConfigurationProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Ask a question</h4>
        <p className="text-sm text-muted-foreground">
          Prompt the user for specific information.
        </p>
      </div>
      <div>
        <Label
          htmlFor={`ask-a-question-prompt-${selectedBlock.id}`}
          className="sr-only"
        >
          Question to ask
        </Label>
        <Textarea
          id={`ask-a-question-prompt-${selectedBlock.id}`}
          placeholder="e.g. What is your email address?"
          className="min-h-[100px]"
          value={selectedBlock.params.prompt || ''}
          onChange={(e) =>
            handleBlockParamChange(
              selectedBlock.id,
              'prompt',
              e.target.value
            )
          }
        />
      </div>
    </div>
  );
}
