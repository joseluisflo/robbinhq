'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { createEditor, Descendant, Editor, Range, Transforms, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
      const label = React.isValidElement(s.label) ? (s.label as any).props.children.join('') : s.label;
      return label.toLowerCase().includes(search.toLowerCase());
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
              insertMention(editor, filteredSuggestions[index]);
            }
            setTarget(null);
            break;
          case 'Escape':
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [index, search, target, editor, filteredSuggestions, singleLine]
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
          >
            <Badge variant="secondary" className="px-1 py-0 text-xs cursor-default hover:bg-secondary">
               {element.label}
            </Badge>
            {children}
          </span>
        );
      default:
        return <p {...attributes} className="m-0 leading-normal">{children}</p>;
    }
  }, []);

  const editorContainerClasses = cn(
    "relative w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text",
    isTextarea ? "min-h-[120px]" : "min-h-[40px] flex items-center",
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
                    const before = Editor.before(editor, start, { unit: 'word' });
                    const beforeRange = before && Editor.range(editor, before, start);
                    const beforeText = beforeRange && Editor.string(editor, beforeRange);
                    const match = beforeText && beforeText.match(/^@(\w*)$/);

                    if (match && beforeRange) {
                        setTarget(beforeRange);
                        setSearch(match[1]);
                        setIndex(0);
                        return;
                    }
                }

                setTarget(null);
            }}
        >
            <Popover open={!!target && filteredSuggestions.length > 0}>
                <PopoverAnchor asChild>
                    <div
                        ref={(el) => {
                            if (target && el) {
                                try {
                                    const domRange = ReactEditor.toDOMRange(editor, target);
                                    const rect = domRange.getBoundingClientRect();
                                    el.style.top = `${rect.bottom + window.scrollY}px`;
                                    el.style.left = `${rect.left + window.scrollX}px`;
                                } catch (e) {
                                    // Sometimes Slate can't resolve the range if the DOM is in flux.
                                    // We can safely ignore this error and wait for the next render.
                                    console.warn("Could not resolve DOM range from Slate range.", e);
                                }
                            }
                        }}
                        style={{position: 'absolute'}}
                    />
                </PopoverAnchor>
                
                <div className={editorContainerClasses}>
                     <Editable
                        renderElement={renderElement}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        className="outline-none w-full"
                    />
                </div>

                <PopoverContent className="p-0 w-[200px]" align="start" onOpenAutoFocus={e => e.preventDefault()}>
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
                                                Transforms.select(editor, target);
                                            }
                                            insertMention(editor, suggestion);
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

const insertMention = (editor: Editor, suggestion: Suggestion) => {
  const mention: MentionElement = {
    type: 'mention',
    id: suggestion.value,
    label: React.isValidElement(suggestion.label) ? (suggestion.label as any).props.children.join('') : suggestion.label,
    children: [{ text: '' }],
  };
  
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};
