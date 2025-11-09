"use client"

import { Fragment, useState } from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
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
      { value: "Block 1" },
      { value: "Block 2" },
    ],
  },
  {
    group: "Tools",
    items: [
      { value: "Block 3" },
      { value: "Block 4" },
    ],
  },
  {
    group: "Logic",
    items: [
      { value: "Block 5" },
    ],
  },
  {
    group: "Data",
    items: [
      { value: "Block 6" },
      { value: "Block 7" },
      { value: "Block 8" },
    ],
  },
]

export function AddBlockPopover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>("")

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
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                        // TODO: Handle adding the block to the workflow
                        console.log("Selected block:", currentValue);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.value ? "opacity-100" : "opacity-0"
                        )}
                      />
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
