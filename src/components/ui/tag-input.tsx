
"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast";

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type Tag = {
  id: string
  text: string
}

export type Suggestion = {
    value: string;
    label: React.ReactNode;
}

export interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: Tag[]
  setTags: (tags: Tag[]) => void
  activeTagIndex?: number | null
  setActiveTagIndex?: (index: number | null) => void;
  suggestions?: Suggestion[];
  styleClasses?: {
    inlineTagsContainer?: string
    input?: string
    tag?: {
      body?: string
      closeButton?: string
    }
  }
}

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const variableRegex = /^{{\s*[\w.-]+\s*}}$/;


export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      id,
      placeholder,
      className,
      tags,
      setTags,
      activeTagIndex,
      setActiveTagIndex,
      suggestions = [],
      styleClasses,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const { toast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (newValue.includes('@') && suggestions.length > 0) {
        setPopoverOpen(true);
      } else {
        setPopoverOpen(false);
      }
    }
    
    const addTag = (text: string) => {
        const trimmedText = text.trim();
        if (trimmedText) {
            if (emailRegex.test(trimmedText) || variableRegex.test(trimmedText)) {
                const newTag = { id: `${Date.now()}`, text: trimmedText };
                setTags([...tags, newTag]);
                setInputValue("");
                setPopoverOpen(false);
            } else {
                toast({
                    title: "Invalid Format",
                    description: "Please enter a valid email address or select a variable like {{variable}}.",
                    variant: "destructive",
                });
            }
        }
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addTag(inputValue);
      } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
        e.preventDefault()
        const newTags = [...tags]
        if (activeTagIndex !== null && activeTagIndex !== undefined) {
          newTags.splice(activeTagIndex, 1)
          setActiveTagIndex?.(null)
        } else {
          newTags.pop()
        }
        setTags(newTags)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (popoverOpen) {
          e.preventDefault();
        }
      }
    }

    const removeTag = (idToRemove: string) => {
      setTags(tags.filter(tag => tag.id !== idToRemove))
    }

    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
            <div
                className={cn(
                "flex flex-wrap items-center gap-2 rounded-md border border-input p-2 shadow-sm",
                styleClasses?.inlineTagsContainer,
                className,
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, index) => (
                <Badge
                    key={tag.id}
                    variant="secondary"
                    className={cn("gap-1 pr-1", styleClasses?.tag?.body)}
                >
                    {tag.text}
                    <button
                    className={cn("rounded-full p-0.5 hover:bg-destructive/20", styleClasses?.tag?.closeButton)}
                    onClick={() => removeTag(tag.id)}
                    >
                    <XIcon className="h-3 w-3" />
                    </button>
                </Badge>
                ))}
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className={cn("flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground", styleClasses?.input)}
                    {...props}
                />
            </div>
        </PopoverTrigger>
         <PopoverContent 
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
            <Command>
              <CommandInput 
                placeholder="Search variables..."
                value={inputValue.substring(inputValue.lastIndexOf('@') + 1)}
                onValueChange={(search) => {
                    const atIndex = inputValue.lastIndexOf('@');
                    setInputValue(inputValue.substring(0, atIndex + 1) + search);
                }}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.value}
                      value={suggestion.value}
                      onSelect={(currentValue) => {
                        addTag(currentValue);
                      }}
                    >
                      {suggestion.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

TagInput.displayName = "TagInput"
