'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, Descendant, Editor, Range, Transforms } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Tipos
import type { Suggestion } from '@/components/ui/tag-input'; 
import { MentionElement } from '@/lib/slate-types';

interface SlateMentionsInputProps {
  suggestions: Suggestion[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  className?: string;
  initialValue?: Descendant[];
  singleLine?: boolean;
  isTextarea?: boolean;
}

export const SlateMentionsInput: React.FC<SlateMentionsInputProps> = ({
  suggestions,
  onChange,
  placeholder,
  className,
  initialValue: initialValueProp,
  singleLine = false,
  isTextarea = false,
}) => {
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  
  const editor = useMemo(() => withMentions(withReact(withHistory(createEditor()))), []);
  
  const initialValue: Descendant[] = useMemo(() => initialValueProp || [{ type: 'paragraph', children: [{ text: '' }] }], [initialValueProp]);

  const filteredSuggestions = suggestions.filter(s => {
      const label = React.isValidElement(s.label) ? (s.label as any).props.children.join('').toLowerCase() : String(s.label).toLowerCase();
      return label.includes(search.toLowerCase());
  });


  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
        if (singleLine && event.key === 'Enter') {
            event.preventDefault();
        }

      if (target && filteredSuggestions.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            const prevIndex = index >= filteredSuggestions.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case 'ArrowUp':
            event.preventDefault();
            const nextIndex = index <= 0 ? filteredSuggestions.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case 'Tab':
          case 'Enter':
            event.preventDefault();
            if(filteredSuggestions[index]) {
              insertMention(editor, filteredSuggestions[index], target);
              setTarget(null);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [index, target, editor, filteredSuggestions, singleLine]
  );

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case 'mention':
        return (
          <span
            {...attributes}
            contentEditable={false}
            className="inline-block align-middle mx-1 select-none"
            data-cy={`mention-${element.label}`}
          >
            <Badge variant="secondary" className="px-1 py-0 text-xs cursor-default hover:bg-secondary pointer-events-none">
               {element.label}
            </Badge>
            {children}
          </span>
        );
      default:
        return <p {...attributes} className={cn("m-0 leading-normal", className)}>{children}</p>;
    }
  }, [className]);

  const editorContainerClasses = cn(
    "relative w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text",
    isTextarea ? "min-h-[120px] items-start" : "min-h-[40px] flex items-center",
    className
  );

  return (
    <div className="relative w-full">
        <Slate 
            editor={editor} 
            initialValue={initialValue}
            onChange={(value) => {
                onChange?.(value);
                const { selection } = editor;

                if (selection && Range.isCollapsed(selection)) {
                    const [start] = Range.edges(selection);
                    const wordBefore = Editor.before(editor, start, { unit: 'word' });
                    const before = wordBefore && Editor.before(editor, wordBefore);
                    const beforeRange = before && Editor.range(editor, before, start);
                    const beforeText = beforeRange && Editor.string(editor, beforeRange);
                    const beforeMatch = beforeText && beforeText.match(/@(\w*)$/);
                    
                    if (beforeMatch) {
                        setTarget(beforeRange);
                        setSearch(beforeMatch[1]);
                        setIndex(0);
                        return;
                    }
                }

                setTarget(null);
            }}
        >
            <Popover open={!!target && filteredSuggestions.length > 0}>
                <PopoverAnchor>
                     <div className={editorContainerClasses}>
                         <Editable
                            renderElement={renderElement}
                            onKeyDown={onKeyDown}
                            placeholder={placeholder}
                            className="outline-none w-full h-full"
                        />
                    </div>
                </PopoverAnchor>
                
                <PopoverContent 
                    className="p-0 w-[--radix-popover-anchor-width]" 
                    align="start" 
                    onOpenAutoFocus={e => e.preventDefault()}
                    onCloseAutoFocus={e => e.preventDefault()}
                    style={{
                        // This is a workaround to make the popover appear below the anchor
                        // when the anchor is at the top of the screen.
                        // You may need to adjust this based on your layout.
                         position: 'relative',
                    }}
                >
                    <Command>
                        <CommandList>
                            <CommandEmpty>No results.</CommandEmpty>
                            <CommandGroup heading="Variables">
                                {filteredSuggestions.map((suggestion, i) => (
                                    <CommandItem
                                        key={suggestion.value}
                                        value={typeof suggestion.label === 'string' ? suggestion.label : suggestion.value}
                                        onSelect={() => {
                                            if (target) {
                                                insertMention(editor, suggestion, target);
                                            }
                                            setTarget(null);
                                        }}
                                        className={i === index ? "bg-accent text-accent-foreground" : ""}
                                    >
                                        {suggestion.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </Slate>
    </div>
  );
};

const withMentions = (editor: ReactEditor) => {
  const { isInline, isVoid, markableVoid } = editor;

  editor.isInline = element => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = element => {
    return element.type === 'mention' ? true : isVoid(element);
  };
  
  editor.markableVoid = element => {
     return element.type === 'mention' || markableVoid(element)
  }

  return editor;
};

const insertMention = (editor: Editor, suggestion: Suggestion, targetRange: Range | null) => {
    if (targetRange) {
        Transforms.select(editor, targetRange);
    }
    
    const mention: MentionElement = {
        type: 'mention',
        id: suggestion.value,
        label: React.isValidElement(suggestion.label) ? (suggestion.label as any).props.children.join('') : String(suggestion.label),
        children: [{ text: '' }],
    };
    
    Transforms.insertNodes(editor, mention);
    Transforms.move(editor);
};
