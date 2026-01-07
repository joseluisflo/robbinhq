'use client';

import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BlockConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
}

export function SendSmsConfiguration({ selectedBlock, handleBlockParamChange }: BlockConfigurationProps) {
    return (
        <div className="space-y-4">
        <div>
            <h4 className="font-semibold">Send SMS</h4>
            <p className="text-sm text-muted-foreground">
                Send an SMS to a specified phone number.
            </p>
        </div>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor={`sms-to-${selectedBlock.id}`}>To</Label>
                <Input
                id={`sms-to-${selectedBlock.id}`}
                placeholder="Phone number or {{variableName}}"
                value={selectedBlock.params.to || ''}
                onChange={(e) =>
                    handleBlockParamChange(
                    selectedBlock.id,
                    'to',
                    e.target.value
                    )
                }
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`sms-message-${selectedBlock.id}`}>
                Message
                </Label>
                <Textarea
                id={`sms-message-${selectedBlock.id}`}
                placeholder="Write your SMS content here."
                className="min-h-[120px]"
                value={selectedBlock.params.message || ''}
                onChange={(e) =>
                    handleBlockParamChange(
                    selectedBlock.id,
                    'message',
                    e.target.value
                    )
                }
                />
            </div>
        </div>
      </div>
    );
}
