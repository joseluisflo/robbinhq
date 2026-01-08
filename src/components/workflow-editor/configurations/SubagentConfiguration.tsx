'use client';

import type { Descendant } from 'slate';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { SlateMentionsInput } from './SlateMentionsInput';
import type { Suggestion } from '@/components/ui/tag-input';


// Helper to convert Slate's Descendant[] back to a string with variables
const serializeToString = (nodes: Descendant[]): string => {
  return nodes.map(n => {
    if (!n.children) return '';
    return (n.children as any[]).map((child: any) => {
      if (child.type === 'mention') {
        return child.id; // The 'id' holds the variable, e.g., "{{user_email}}"
      }
      return child.text;
    }).join('');
  }).join('\n');
};

// Helper to convert a string with variables into Slate's initialValue
const deserializeFromString = (text: string): Descendant[] => {
    if (!text) {
        return [{ type: 'paragraph', children: [{ text: '' }] }];
    }

    const variableRegex = /{{\s*[\w.-]+\s*}}/g;
    const parts = text.split(variableRegex);
    const matches = [...text.matchAll(variableRegex)];
    
    const children: any[] = [];

    parts.forEach((part, index) => {
        if (part) {
            children.push({ text: part });
        }
        const match = matches[index];
        if (match) {
            const variableId = match[0];
            const label = variableId; 
            children.push({
                type: 'mention',
                id: variableId,
                label: label,
                children: [{ text: '' }],
            });
        }
    });

    return [{ type: 'paragraph', children: children.length > 0 ? children : [{ text: '' }] }];
};


interface SubagentConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
  suggestions: Suggestion[];
}

export function SubagentConfiguration({ selectedBlock, handleBlockParamChange, suggestions }: SubagentConfigurationProps) {

  const initialPromptValue = deserializeFromString(selectedBlock.params.prompt || '');

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Sub-agent</h4>
        <p className="text-sm text-muted-foreground">
          Define the task for the sub-agent to perform.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`subagent-prompt-${selectedBlock.id}`}>
          Prompt
        </Label>
        <SlateMentionsInput
            initialValue={initialPromptValue}
            suggestions={suggestions}
            onChange={(newValue) => {
                const stringValue = serializeToString(newValue);
                handleBlockParamChange(selectedBlock.id, 'prompt', stringValue);
            }}
            placeholder="e.g., Summarize the following text: {{userInput}}"
            isTextarea={true}
        />
      </div>
    </div>
  );
}
