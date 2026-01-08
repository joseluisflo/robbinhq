'use client';

import { useState, useEffect } from 'react';
import type { Descendant, Node as SlateNode } from 'slate';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Tag, TagInput, type Suggestion } from '@/components/ui/tag-input';
import { SlateMentionsInput } from './SlateMentionsInput';

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
            // Find the suggestion to get the label
            const label = variableId; // Fallback to id if not found
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


interface SendEmailConfigurationProps {
    selectedBlock: WorkflowBlock;
    handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
    suggestions: Suggestion[];
}

export function SendEmailConfiguration({ selectedBlock, handleBlockParamChange, suggestions }: SendEmailConfigurationProps) {
    const [emailTags, setEmailTags] = useState<Tag[]>([]);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

    // Initial values for Slate editors
    const initialSubjectValue = deserializeFromString(selectedBlock.params.subject || '');
    const initialBodyValue = deserializeFromString(selectedBlock.params.body || '');


    useEffect(() => {
        const toValue = selectedBlock.params.to;
        if (typeof toValue === 'string' && toValue) {
            setEmailTags(toValue.split(',').map((email, i) => ({ id: `${i}`, text: email.trim() })));
        } else if (Array.isArray(toValue)) {
            setEmailTags(toValue.map((email, i) => ({ id: `${i}`, text: email.trim() })));
        } else {
            setEmailTags([]);
        }
    }, [selectedBlock.params.to]);

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold">Send Email</h4>
                <p className="text-sm text-muted-foreground">
                    Send an email to a specified recipient.
                </p>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`email-to-${selectedBlock.id}`}>To</Label>
                    <TagInput
                        id={`email-to-${selectedBlock.id}`}
                        placeholder="Add recipient or type @ for variables..."
                        tags={emailTags}
                        setTags={(newTags) => {
                            const newEmails = newTags.map(tag => tag.text).join(', ');
                            handleBlockParamChange(selectedBlock.id, 'to', newEmails);
                        }}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                        suggestions={suggestions}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`email-subject-${selectedBlock.id}`}>
                    Subject
                    </Label>
                     <SlateMentionsInput
                        initialValue={initialSubjectValue}
                        suggestions={suggestions}
                        onChange={(newValue) => {
                            const stringValue = serializeToString(newValue);
                            handleBlockParamChange(selectedBlock.id, 'subject', stringValue);
                        }}
                        placeholder="Type subject or use @ for variables"
                        singleLine={true} // For subject-like behavior
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`email-body-${selectedBlock.id}`}>
                    Body
                    </Label>
                    <SlateMentionsInput
                        initialValue={initialBodyValue}
                        suggestions={suggestions}
                        onChange={(newValue) => {
                            const stringValue = serializeToString(newValue);
                            handleBlockParamChange(selectedBlock.id, 'body', stringValue);
                        }}
                        placeholder="Write your email content here. Use @ for variables."
                        isTextarea={true} // For body-like behavior
                    />
                </div>
            </div>
      </div>
    )
}
