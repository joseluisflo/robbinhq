
"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type Tag = {
  id: string
  text: string
}

export interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: Tag[]
  setTags: (tags: Tag[]) => void
  activeTagIndex?: number | null
  setActiveTagIndex?: (index: number | null) => void
  styleClasses?: {
    inlineTagsContainer?: string
    input?: string
    tag?: {
      body?: string
      closeButton?: string
    }
  }
}

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
      styleClasses,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        const newTagText = inputValue.trim()
        if (newTagText) {
          setTags([...tags, { id: `${Date.now()}`, text: newTagText }])
          setInputValue("")
        }
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
      }
    }

    const removeTag = (idToRemove: string) => {
      setTags(tags.filter(tag => tag.id !== idToRemove))
    }

    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-md border border-input p-2",
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
    )
  },
)

TagInput.displayName = "TagInput"
