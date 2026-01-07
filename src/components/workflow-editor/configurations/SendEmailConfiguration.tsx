'use client';

import { useState, useEffect, useRef } from 'react';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tag, TagInput, type Suggestion } from '@/components/ui/tag-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface SendEmailConfigurationProps {
    selectedBlock: WorkflowBlock;
    handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
    suggestions: Suggestion[];
}

export function SendEmailConfiguration({ selectedBlock, handleBlockParamChange, suggestions }: SendEmailConfigurationProps) {
    const [emailTags, setEmailTags] = useState<Tag[]>([]);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
    
    // State for the Subject field popover
    const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
    const [subjectSearch, setSubjectSearch] = useState('');
    const subjectInputRef = useRef<HTMLInputElement>(null);
    const lastTriggerIndexRef = useRef(-1);


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

    const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        handleBlockParamChange(selectedBlock.id, 'subject', value);

        const cursorPosition = e.target.selectionStart || 0;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        const slashIndex = textBeforeCursor.lastIndexOf('/');

        const triggerIndex = Math.max(atIndex, slashIndex);

        if (triggerIndex !== -1 && !value.substring(triggerIndex + 1, cursorPosition).includes(' ')) {
            lastTriggerIndexRef.current = triggerIndex;
            setSubjectSearch(value.substring(triggerIndex + 1, cursorPosition));
            setSubjectPopoverOpen(true);
        } else {
            setSubjectPopoverOpen(false);
        }
    };
    
    const insertVariableInSubject = (variable: string) => {
        const subject = selectedBlock.params.subject || '';
        const input = subjectInputRef.current;
        if (!input) return;

        const triggerIndex = lastTriggerIndexRef.current;
        
        if (triggerIndex !== -1) {
            const textBefore = subject.substring(0, triggerIndex);
            
            // Find where the search term ends
            const currentSearchTerm = subjectSearch;
            const textAfter = subject.substring(triggerIndex + 1 + currentSearchTerm.length);

            const newSubject = `${textBefore}${variable}${textAfter}`;

            handleBlockParamChange(selectedBlock.id, 'subject', newSubject);
            
            // Move cursor after the inserted variable
            setTimeout(() => {
                input.focus();
                const newCursorPosition = (textBefore + variable).length;
                input.setSelectionRange(newCursorPosition, newCursorPosition);
            }, 0);
        }

        setSubjectPopoverOpen(false);
        setSubjectSearch('');
    };

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
                 <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Input
                            ref={subjectInputRef}
                            id={`email-subject-${selectedBlock.id}`}
                            placeholder="Type your subject or type @ for variables..."
                            value={selectedBlock.params.subject || ''}
                            onChange={handleSubjectChange}
                            autoComplete="off"
                        />
                    </PopoverTrigger>
                    <PopoverContent 
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <Command>
                          <CommandInput 
                            placeholder="Search variables..."
                            value={subjectSearch}
                            onValueChange={setSubjectSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                              {suggestions.filter(s => s.value.toLowerCase().includes(subjectSearch.toLowerCase())).map((suggestion) => (
                                <CommandItem
                                  key={suggestion.value}
                                  value={suggestion.value}
                                  onSelect={() => insertVariableInSubject(suggestion.value)}
                                >
                                  {suggestion.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
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
