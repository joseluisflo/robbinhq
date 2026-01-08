'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, Descendant, Editor, Range, Transforms } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty, CommandInput } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Types
interface Suggestion {
  value: string;
  label: string | React.ReactElement;
}

interface MentionElement {
  type: 'mention';
  id: string;
  label: string;
  children: { text: string }[];
}

interface SlateMentionsInputProps {
  suggestions: Suggestion[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  className?: string;
  initialValue?: Descendant[];
  singleLine?: boolean;
  isTextarea?: boolean;
  triggerChars?: string[];
}

export const SlateMentionsInput: React.FC<SlateMentionsInputProps> = ({
  suggestions,
  onChange,
  placeholder,
  className,
  initialValue: initialValueProp,
  singleLine = false,
  isTextarea = false,
  triggerChars = ['@', '/'],
}) => {
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  
  const editor = useMemo(() => withMentions(withReact(withHistory(createEditor()))), []);
  
  const initialValue: Descendant[] = useMemo(() => initialValueProp || [{ type: 'paragraph', children: [{ text: '' }] }], [initialValueProp]);

  const filteredSuggestions = suggestions.filter(s => {
      const label = React.isValidElement(s.label) ? 
          ((s.label as any).props.children.find((c: any) => typeof c === 'string' && c.includes(search)) || s.value)
          : String(s.label).toLowerCase();
      return label.toLowerCase().includes(search.toLowerCase());
  });

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
        if (singleLine && event.key === 'Enter' && !target) {
            event.preventDefault();
        }

      if (target && filteredSuggestions.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setIndex(prevIndex => (prevIndex >= filteredSuggestions.length - 1 ? 0 : prevIndex + 1));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setIndex(prevIndex => (prevIndex <= 0 ? filteredSuggestions.length - 1 : prevIndex - 1));
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
        return <div {...attributes} className={cn("m-0 leading-normal", className)}>{children}</div>;
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
                    const before = Editor.before(editor, start, { unit: 'word' });
                    const beforeRange = before && Editor.range(editor, before, start);
                    const beforeText = beforeRange && Editor.string(editor, beforeRange);
                    const triggerRegex = new RegExp(`([${triggerChars.join('')}])(\\w*)$`);
                    const match = beforeText && beforeText.match(triggerRegex);

                    if (match) {
                        setTarget(beforeRange);
                        setSearch(match[2]);
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
                >
                    <Command>
                        <CommandInput 
                            placeholder="Search variables..."
                            value={search}
                            onValueChange={setSearch}
                        />
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
        label: React.isValidElement(suggestion.label) ? 
               (suggestion.label as any).props.children.find((c: any) => typeof c === 'object')?.props.children || (suggestion.label as any).props.children[0]
               : String(suggestion.label),
        children: [{ text: '' }],
    };
    
    // Replace the trigger text with the mention
    Transforms.insertNodes(editor, mention);
    // Move the cursor after the inserted mention
    Transforms.move(editor);
    // Add a space after the mention
    Transforms.insertText(editor, ' ');
};

// Demo Component (can be removed if not needed)
export default function Demo() {
  const suggestions = [
    { value: '{{name}}', label: 'Name' },
    { value: '{{email}}', label: 'Email' },
    { value: '{{phone}}', label: 'Phone' },
    { value: '{{address}}', label: 'Address' },
    { value: '{{company}}', label: 'Company' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Slate Mentions Input</h1>
        <p className="text-muted-foreground mb-4">
          Type @ or / to see the variable suggestions menu
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Single Line Input</label>
          <SlateMentionsInput
            suggestions={suggestions}
            placeholder="Type @ or / to insert variables..."
            singleLine={true}
            onChange={(value) => console.log('Value:', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Textarea</label>
          <SlateMentionsInput
            suggestions={suggestions}
            placeholder="Type @ or / to insert variables..."
            isTextarea={true}
            onChange={(value) => console.log('Value:', value)}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Type @ or / followed by text to filter suggestions</li>
          <li>Use arrow keys to navigate the menu</li>
          <li>Press Enter or Tab to select a suggestion</li>
          <li>Press Escape to close the menu</li>
        </ul>
      </div>
    </div>
  );
}