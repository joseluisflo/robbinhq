'use client';

import type { Descendant } from 'slate';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlateMentionsInput } from './SlateMentionsInput';
import type { Suggestion } from '@/components/ui/tag-input';

const serializeToString = (nodes: Descendant[]): string => {
  return nodes.map(n => {
    if (!n.children) return '';
    return (n.children as any[]).map((child: any) => {
      if (child.type === 'mention') return child.id;
      return child.text;
    }).join('');
  }).join('\n');
};

const deserializeFromString = (text: string): Descendant[] => {
    if (!text) return [{ type: 'paragraph', children: [{ text: '' }] }];
    const variableRegex = /{{\s*[\w.-]+\s*}}/g;
    const parts = text.split(variableRegex);
    const matches = [...text.matchAll(variableRegex)];
    const children: any[] = [];
    parts.forEach((part, index) => {
        if (part) children.push({ text: part });
        const match = matches[index];
        if (match) {
            children.push({
                type: 'mention',
                id: match[0],
                label: match[0],
                children: [{ text: '' }],
            });
        }
    });
    return [{ type: 'paragraph', children: children.length > 0 ? children : [{ text: '' }] }];
};


interface ConditionConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
  suggestions: Suggestion[];
}

const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
];

export function ConditionConfiguration({ selectedBlock, handleBlockParamChange, suggestions }: ConditionConfigurationProps) {
  
  const initialValue1 = deserializeFromString(selectedBlock.params.value1 || '');
  const initialValue2 = deserializeFromString(selectedBlock.params.value2 || '');

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Condition</h4>
        <p className="text-sm text-muted-foreground">
          Create a conditional path in your workflow.
        </p>
      </div>
      <div className="space-y-2">
        <Label>If this value...</Label>
        <SlateMentionsInput
            initialValue={initialValue1}
            suggestions={suggestions}
            onChange={(newValue) => {
                const stringValue = serializeToString(newValue);
                handleBlockParamChange(selectedBlock.id, 'value1', stringValue);
            }}
            placeholder="Select a variable..."
            singleLine
        />
      </div>
       <div className="space-y-2">
        <Label>is...</Label>
        <Select
            value={selectedBlock.params.operator || 'equals'}
            onValueChange={(value) => handleBlockParamChange(selectedBlock.id, 'operator', value)}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select an operator" />
            </SelectTrigger>
            <SelectContent>
                {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
       <div className="space-y-2">
        <Label>this value...</Label>
        <SlateMentionsInput
            initialValue={initialValue2}
            suggestions={suggestions}
            onChange={(newValue) => {
                const stringValue = serializeToString(newValue);
                handleBlockParamChange(selectedBlock.id, 'value2', stringValue);
            }}
            placeholder="Enter a value or select a variable..."
            singleLine
        />
      </div>
      <p className="text-xs text-muted-foreground">If the condition is true, the workflow will follow the 'Yes' path. Otherwise, it will follow the 'No' path.</p>
    </div>
  );
}
