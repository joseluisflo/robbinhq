'use client';

import { useState } from 'react';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';

interface ShowMultipleChoiceConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
}

export function ShowMultipleChoiceConfiguration({ selectedBlock, handleBlockParamChange }: ShowMultipleChoiceConfigurationProps) {
    const [newOption, setNewOption] = useState('');

    const handleAddOption = () => {
        if (newOption.trim() && selectedBlock) {
          const currentOptions = selectedBlock.params.options || [];
          handleBlockParamChange(selectedBlock.id, 'options', [...currentOptions, newOption.trim()]);
          setNewOption('');
        }
      };
    
      const handleRemoveOption = (indexToRemove: number) => {
        if (selectedBlock) {
          const currentOptions = selectedBlock.params.options || [];
          const updatedOptions = currentOptions.filter((_: any, index: number) => index !== indexToRemove);
          handleBlockParamChange(selectedBlock.id, 'options', updatedOptions);
        }
      };

    return (
        <div className="space-y-4">
            <div>
            <h4 className="font-semibold">Show Multiple Choice</h4>
            <p className="text-sm text-muted-foreground">
                Present the user with a set of options to choose from.
            </p>
            </div>
            <div className="space-y-2">
            <Label htmlFor={`multiple-choice-prompt-${selectedBlock.id}`}>
                Prompt
            </Label>
            <Textarea
                id={`multiple-choice-prompt-${selectedBlock.id}`}
                placeholder="e.g. What would you like to do next?"
                value={selectedBlock.params.prompt || ''}
                onChange={(e) => handleBlockParamChange(selectedBlock.id, 'prompt', e.target.value)}
            />
            </div>
            <div className="space-y-2">
            <Label>Options</Label>
                <ul className="space-y-2">
                {(selectedBlock.params.options || []).map((option: string, index: number) => (
                    <li key={index} className="flex items-center justify-between text-sm p-2 border rounded-md bg-muted/50">
                        <span className="truncate pr-2">{option}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveOption(index)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </li>
                ))}
                </ul>
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Add a new option"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                    }
                }}
                />
                <Button onClick={handleAddOption} disabled={!newOption.trim()}>
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>
            </div>
        </div>
    );
}
