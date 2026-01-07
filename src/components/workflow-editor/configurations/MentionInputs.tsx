'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Suggestion } from '@/components/ui/tag-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface MentionsInputProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  singleLine?: boolean;
}

export const MentionsTextarea: React.FC<MentionsInputProps> = ({
  id,
  value: externalValue,
  onValueChange,
  suggestions,
  placeholder,
  singleLine = false,
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
    
    setInternalValue(newValue);
    onValueChange(newValue);
  };
  
  const handleSuggestionSelect = (suggestionValue: string) => {
    const textBefore = internalValue.substring(0, cursorIndex -1); 
    const textAfter = internalValue.substring(cursorIndex + query.length);
    
    const newValue = `${textBefore}${suggestionValue} ${textAfter}`;
    setInternalValue(newValue);
    onValueChange(newValue);
    
    setPopoverOpen(false);
    setTrigger(null);
    setQuery('');

    setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = (textBefore + suggestionValue).length + 1;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.value.toLowerCase().includes(query.toLowerCase())
  );
  
  const InputComponent = singleLine ? Input : Textarea;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <InputComponent
            ref={inputRef as any}
            id={id}
            value={internalValue}
            onChange={handleValueChange}
            placeholder={placeholder}
            className={singleLine ? "" : "min-h-[120px]"}
            onKeyDown={(e) => {
                if (popoverOpen && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter")) {
                    e.preventDefault();
                }
            }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={`Search variables...`}
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
