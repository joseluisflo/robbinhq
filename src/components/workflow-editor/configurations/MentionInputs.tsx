'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Suggestion {
  value: string;
  label: React.ReactNode;
}

interface MentionsInputProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
}

const SharedMentionsComponent: React.FC<MentionsInputProps & { as: 'input' | 'textarea' }> = ({
  id,
  value: externalValue,
  onValueChange,
  suggestions,
  placeholder,
  as: componentType,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [trigger, setTrigger] = useState<'@' | '/' | null>(null);
  const [query, setQuery] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [internalValue, setInternalValue] = useState(externalValue);
  
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    setInternalValue(newValue);
    onValueChange(newValue);

    const lastTypedChar = newValue[cursor - 1];
    if (lastTypedChar === '@' || lastTypedChar === '/') {
        setTrigger(lastTypedChar);
        setQuery('');
        setPopoverOpen(true);
        setCursorIndex(cursor);
    } else if (trigger) {
        const textSinceTrigger = newValue.substring(cursorIndex, cursor);
        const spaceIndex = textSinceTrigger.indexOf(' ');
        
        if (spaceIndex > -1 || textSinceTrigger.includes('\n')) {
            setPopoverOpen(false);
            setTrigger(null);
        } else {
            setQuery(textSinceTrigger);
        }
    }
  };
  
  const handleSuggestionSelect = (suggestionValue: string) => {
    const textBefore = internalValue.substring(0, cursorIndex - 1); 
    const textAfter = internalValue.substring(cursorIndex + query.length);
    
    const newValue = `${textBefore}${suggestionValue} ${textAfter}`;
    setInternalValue(newValue);
    onValueChange(newValue);
    
    setPopoverOpen(false);
    setTrigger(null);
    setQuery('');

    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            const newCursorPos = (textBefore + suggestionValue).length + 1;
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  const filteredSuggestions = suggestions.filter(s => 
    typeof s.label === 'string' && s.label.toLowerCase().includes(query.toLowerCase())
  );

  const Component = componentType === 'input' ? Input : Textarea;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Component
            ref={inputRef as any}
            id={id}
            value={internalValue}
            onChange={handleValueChange}
            placeholder={placeholder}
            className={componentType === 'textarea' ? "min-h-[120px]" : ""}
            onKeyDown={(e: any) => {
                if (popoverOpen && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter")) {
                    e.preventDefault();
                }
            }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search variables..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.value}
                  value={suggestion.value}
                  onSelect={() => handleSuggestionSelect(suggestion.value)}
                >
                  {suggestion.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const MentionInput: React.FC<MentionsInputProps> = (props) => (
    <SharedMentionsComponent {...props} as="input" />
);

export const MentionTextarea: React.FC<MentionsInputProps> = (props) => (
    <SharedMentionsComponent {...props} as="textarea" />
);