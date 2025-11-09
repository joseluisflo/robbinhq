"use client"

import { Fragment, useState } from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const blockGroups = [
  {
    group: "Core",
    items: [
      { value: "Trigger" },
    ],
  },
  {
    group: "Tools",
    items: [
      { value: "Ask a question" },
      { value: "Search web" },
    ],
  },
  {
    group: "Logic",
    items: [
      { value: "Condition" },
      { value: "Loop" },
    ],
  },
  {
    group: "Data",
    items: [
      { value: "Set variable" },
    ],
  },
]

export function AddBlockPopover({ children, onAddBlock }: { children: React.ReactNode, onAddBlock: (blockType: string) => void }) {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] border-input p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search blocks..." />
          <CommandList>
            <CommandEmpty>No block found.</CommandEmpty>
            {blockGroups.map((group) => (
              <Fragment key={group.group}>
                <CommandGroup heading={group.group}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => {
                        onAddBlock(item.value);
                        setOpen(false)
                      }}
                    >
                      {item.value}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
