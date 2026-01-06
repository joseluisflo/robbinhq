'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { availableVoices } from '@/lib/voices';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface VoiceSelectorProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export function VoiceSelector({ selectedValue, onValueChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedValue ? availableVoices.find((v) => v.name === selectedValue)?.name : 'Select a voice...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search voice..." />
          <CommandEmpty>No voice found.</CommandEmpty>
          <ScrollArea className="max-h-72">
            <CommandList>
              <CommandGroup>
                {availableVoices.map((voice) => (
                  <CommandItem
                    key={voice.name}
                    value={voice.name}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === selectedValue ? '' : voice.name);
                      setOpen(false);
                    }}
                    className="flex flex-col items-start px-3 py-2 cursor-pointer"
                  >
                    <div className="flex items-center w-full">
                       <p className="font-semibold">{voice.name}</p>
                       <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedValue === voice.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{voice.description}</p>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
