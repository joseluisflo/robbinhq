'use client';

import { useState, Fragment } from 'react';
import type { WorkflowBlock } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { Suggestion } from '@/components/ui/tag-input';

interface SetVariableConfigurationProps {
    selectedBlock: WorkflowBlock;
    handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
    suggestions: Suggestion[];
}

export function SetVariableConfiguration({ selectedBlock, handleBlockParamChange, suggestions }: SetVariableConfigurationProps) {
    const handleAddVariable = () => {
        const currentVariables = selectedBlock.params.variables || [];
        handleBlockParamChange(selectedBlock.id, 'variables', [...currentVariables, { name: '', value: '' }]);
    };

    const handleVariableChange = (index: number, field: 'name' | 'value', fieldValue: string) => {
        const currentVariables = selectedBlock.params.variables || [];
        
        let finalValue = fieldValue;
        
        if (field === 'name') {
            // Reemplaza espacios por guiones bajos en nombres de variables
            finalValue = fieldValue.replace(/\s+/g, '_');
        }

        const updatedVariables = currentVariables.map((v: any, i: number) => 
            i === index ? { ...v, [field]: finalValue } : v
        );
        handleBlockParamChange(selectedBlock.id, 'variables', updatedVariables);
    };

    const handleRemoveVariable = (indexToRemove: number) => {
        const currentVariables = selectedBlock.params.variables || [];
        if (currentVariables.length <= 1) return;
        const updatedVariables = currentVariables.filter((_: any, index: number) => index !== indexToRemove);
        handleBlockParamChange(selectedBlock.id, 'variables', updatedVariables);
    };
    
    // Manage popover state for each variable input independently
    const [openPopovers, setOpenPopovers] = useState<boolean[]>(
        (selectedBlock.params.variables || []).map(() => false)
    );
     const [search, setSearch] = useState('');


    const setPopoverOpen = (index: number, open: boolean) => {
        const newOpenState = [...openPopovers];
        newOpenState[index] = open;
        setOpenPopovers(newOpenState);
        if (!open) {
            setSearch(''); // Reset search on close
        }
    }
    
    const blockResultSuggestions = suggestions.filter(s => 
        !s.value.startsWith('{{userInput}}') && 
        !s.label.toString().toLowerCase().includes('set variable') &&
        (typeof s.label === 'string' ? s.label.toLowerCase().includes(search.toLowerCase()) : true)
    );

    const variableSuggestions = suggestions.filter(s => 
        (s.value.startsWith('{{userInput}}') || s.label.toString().toLowerCase().includes('set variable')) &&
        (typeof s.label === 'string' ? s.label.toLowerCase().includes(search.toLowerCase()) : true)
    );


    return (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h4 className="font-semibold">Set variable</h4>
                <p className="text-sm text-muted-foreground">
                    Store values in variables to use later in the workflow.
                </p>
            </div>
             <Button variant="outline" size="sm" onClick={handleAddVariable}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add variable
            </Button>
        </div>
        <div className="space-y-2">
            {(selectedBlock.params.variables || []).map((variable: any, index: number) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                     <div className="space-y-1.5">
                        <Label htmlFor={`variable-name-${selectedBlock.id}-${index}`}>
                            Variable Name
                        </Label>
                        <Input
                        id={`variable-name-${selectedBlock.id}-${index}`}
                        placeholder="e.g. user_email"
                        value={variable.name || ''}
                        onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`variable-value-${selectedBlock.id}-${index}`}>
                        Value
                        </Label>
                        <Popover open={openPopovers[index]} onOpenChange={(open) => setPopoverOpen(index, open)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between shadow-sm rounded-lg"
                                >
                                    <span className="truncate">{variable.value || "Select a value..."}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search value..." value={search} onValueChange={setSearch} />
                                    <CommandList>
                                        <CommandEmpty>No value found.</CommandEmpty>
                                        {variableSuggestions.length > 0 && (
                                            <CommandGroup heading="Variables">
                                                {variableSuggestions.map((suggestion) => (
                                                <CommandItem
                                                    key={suggestion.value}
                                                    value={suggestion.value}
                                                    onSelect={(currentValue) => {
                                                        handleVariableChange(index, 'value', currentValue);
                                                        setPopoverOpen(index, false);
                                                    }}
                                                >
                                                    {suggestion.label}
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                        {blockResultSuggestions.length > 0 && (
                                            <CommandGroup heading="Block Results">
                                                {blockResultSuggestions.map((suggestion) => (
                                                <CommandItem
                                                    key={suggestion.value}
                                                    value={suggestion.value}
                                                    onSelect={(currentValue) => {
                                                        handleVariableChange(index, 'value', currentValue);
                                                        setPopoverOpen(index, false);
                                                    }}
                                                >
                                                    {suggestion.label}
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {(selectedBlock.params.variables.length > 1) && (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleRemoveVariable(index)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
        </div>
      </div>
    )
}
