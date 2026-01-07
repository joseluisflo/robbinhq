'use client';

import { useState, useEffect } from 'react';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tag, TagInput, type Suggestion } from '@/components/ui/tag-input';
import { MentionsInput, Mention } from 'react-mentions';

interface SendEmailConfigurationProps {
    selectedBlock: WorkflowBlock;
    handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
    suggestions: Suggestion[];
}

export function SendEmailConfiguration({ selectedBlock, handleBlockParamChange, suggestions }: SendEmailConfigurationProps) {
    const [emailTags, setEmailTags] = useState<Tag[]>([]);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

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

    const handleSubjectChange = (event: any, newValue: string) => {
        handleBlockParamChange(selectedBlock.id, 'subject', newValue);
    };

    const mentionSuggestions = suggestions.map(s => ({
        id: s.value,
        display: s.value,
    }));

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
                    <div className="mentions">
                       <MentionsInput
                            id={`email-subject-${selectedBlock.id}`}
                            value={selectedBlock.params.subject || ''}
                            onChange={handleSubjectChange}
                            placeholder="Type your subject and use '{{' to add variables..."
                            className="mentions"
                            classNames={{
                                control: 'mentions__control',
                                input: 'mentions__input',
                                suggestions: 'mentions__suggestions',
                                list: 'mentions__suggestions__list',
                                item: 'mentions__suggestions__item',
                                'item--focused': 'mentions__suggestions__item--focused',
                            }}
                        >
                            <Mention
                                trigger="{{}}"
                                data={mentionSuggestions}
                                markup="{{__display__}}"
                                className="mentions__mention"
                                appendSpaceOnAdd
                            />
                        </MentionsInput>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`email-body-${selectedBlock.id}`}>
                    Body
                    </Label>
                    <Textarea
                    id={`email-body-${selectedBlock.id}`}
                    placeholder="Write your email content here."
                    className="min-h-[120px]"
                    value={selectedBlock.params.body || ''}
                    onChange={(e) =>
                        handleBlockParamChange(
                        selectedBlock.id,
                        'body',
                        e.target.value
                        )
                    }
                    />
                </div>
            </div>
      </div>
    )
}
