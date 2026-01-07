'use client';

import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BlockConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
}

export function SearchWebConfiguration({ selectedBlock, handleBlockParamChange }: BlockConfigurationProps) {
    return (
        <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Search web</h4>
          <p className="text-sm text-muted-foreground">
            Define what the agent should search for on the internet.
          </p>
        </div>
        <div>
          <Label
            htmlFor={`search-web-query-${selectedBlock.id}`}
            className="sr-only"
          >
            Search query
          </Label>
          <Textarea
            id={`search-web-query-${selectedBlock.id}`}
            placeholder="e.g. Latest trends in AI development"
            className="min-h-[100px]"
            value={selectedBlock.params.query || ''}
            onChange={(e) =>
              handleBlockParamChange(
                selectedBlock.id,
                'query',
                e.target.value
              )
            }
          />
        </div>
      </div>
    );
}
