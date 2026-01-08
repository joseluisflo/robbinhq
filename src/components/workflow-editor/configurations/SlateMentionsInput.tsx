'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { createEditor, Descendant, Editor, Range, Transforms, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Usamos el Badge de Shadcn para el chip
import type { Suggestion } from '@/components/ui/tag-input';
import { MentionElement } from '@/lib/slate-types';

interface SlateMentionsInputProps {
  suggestions: Suggestion[];
  onChange?: (value: Descendant[]) => void; // Devuelve el JSON de Slate
  placeholder?: string;
  className?: string;
  initialValue?: Descendant[];
}

export const SlateMentionsInput: React.FC<SlateMentionsInputProps> = ({
  suggestions,
  onChange,
  placeholder,
  className,
  initialValue: initialValueProp,
}) => {
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  
  // Inicializamos el editor con los plugins necesarios
  const editor = useMemo(() => withMentions(withReact(withHistory(createEditor()))), []);
  
  // Valor inicial (Un párrafo vacío)
  const initialValue: Descendant[] = useMemo(() => initialValueProp || [{ type: 'paragraph', children: [{ text: '' }] }], [initialValueProp]);

  const filteredSuggestions = suggestions.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  // --- LÓGICA DE DETECCIÓN DE @ o / ---
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
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
    [index, search, target, editor, filteredSuggestions]
  );

  // --- RENDERIZADO DE ELEMENTOS (Chips vs Texto) ---
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case 'mention':
        return (
          <span
            {...attributes}
            contentEditable={false} // CRUCIAL: Slate maneja esto como una unidad atómica
            className="inline-block align-middle mx-1 select-none"
          >
            {/* Aquí usamos tu estilo de Shadcn */}
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

  return (
    <div className={cn("relative w-full", className)}>
        <Slate 
            editor={editor} 
            initialValue={initialValue} 
            onChange={(value) => {
                onChange?.(value);
                
                // Lógica para detectar triggers (@ o /)
                const { selection } = editor;
                if (selection && Range.isCollapsed(selection)) {
                    const [start] = Range.edges(selection);
                    const wordBefore = Editor.before(editor, start, { unit: 'word' });
                    const before = wordBefore && Editor.before(editor, wordBefore);
                    const beforeRange = before && Editor.range(editor, before, start);
                    const beforeText = beforeRange && Editor.string(editor, beforeRange);
                    
                    // Regex para capturar @algo o /algo
                    const match = beforeText && beforeText.match(/^(@|\/)([\w-]*)$/);
                    
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
             {/* POPOVER DE SHADCN ANCLADO AL CURSOR */}
            <Popover open={!!target && filteredSuggestions.length > 0}>
                <PopoverAnchor
                    ref={(el) => {
                        if (target && el) {
                            const domRange = ReactEditor.toDOMRange(editor, target);
                            const rect = domRange.getBoundingClientRect();
                            el.style.top = `${rect.top + window.scrollY}px`;
                            el.style.left = `${rect.left + window.scrollX}px`;
                        }
                    }}
                />
                
                <div className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text">
                     <Editable
                        renderElement={renderElement}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        className="outline-none min-h-[60px]"
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
                                        value={suggestion.label} // Usamos label para el key interno de Command
                                        onSelect={() => {
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

// --- PLUGIN DE SLATE PARA MENCIONES ---
// Esto le dice a Slate que los nodos 'mention' son inline (fluyen con el texto)
// y void (no tienen contenido editable dentro)
const withMentions = (editor: ReactEditor) => {
  const { isInline, isVoid, markableVoid } = editor;

  editor.isInline = element => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = element => {
    return element.type === 'mention' ? true : isVoid(element);
  };
  
  // Esto previene bugs raros de selección al borrar
  editor.markableVoid = element => {
     return element.type === 'mention' || markableVoid(element)
  }

  return editor;
};

// --- FUNCIÓN PARA INSERTAR EL NODO ---
const insertMention = (editor: Editor, suggestion: Suggestion) => {
  const mention: MentionElement = {
    type: 'mention',
    id: suggestion.value,
    label: suggestion.label,
    children: [{ text: '' }], // Los void nodes necesitan un hijo vacío
  };
  
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor); // Mover el cursor después del chip
};