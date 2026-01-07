'use client';

import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BlockConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
}

export function CreatePdfConfiguration({ selectedBlock, handleBlockParamChange }: BlockConfigurationProps) {
    return (
        <div className="space-y-4">
        <div>
            <h4 className="font-semibold">Create PDF</h4>
            <p className="text-sm text-muted-foreground">
                Generate a PDF document from text content.
            </p>
        </div>
        <div className="space-y-2">
            <Label htmlFor={`pdf-content-${selectedBlock.id}`}>Content</Label>
            <Textarea
            id={`pdf-content-${selectedBlock.id}`}
            placeholder="Enter the text content for the PDF."
            className="min-h-[200px]"
            value={selectedBlock.params.content || ''}
            onChange={(e) =>
                handleBlockParamChange(
                selectedBlock.id,
                'content',
                e.target.value
                )
            }
            />
        </div>
        </div>
    )
}
