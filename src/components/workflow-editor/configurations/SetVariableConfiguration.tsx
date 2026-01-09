'use client';

import { useState } from 'react';
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
    
    // --- MANEJO DEL ESTADO DE LOS POPOVERS Y BÚSQUEDA ---
    const [openPopovers, setOpenPopovers] = useState<boolean[]>(
        (selectedBlock.params.variables || []).map(() => false)
    );
    const [search, setSearch] = useState('');

    const setPopoverOpen = (index: number, open: boolean) => {
        const newOpenState = [...openPopovers];
        newOpenState[index] = open;
        setOpenPopovers(newOpenState);
        
        // Limpiamos la búsqueda cuando se cierra para que la próxima vez aparezca todo
        if (!open) {
            setSearch(''); 
        }
    };

    // --- MANEJO DE CAMBIOS EN VARIABLES (ADD, EDIT, REMOVE) ---
    const handleAddVariable = () => {
        const currentVariables = selectedBlock.params.variables || [];
        // Al agregar, sincronizamos el estado de los popovers
        setOpenPopovers([...openPopovers, false]);
        handleBlockParamChange(selectedBlock.id, 'variables', [...currentVariables, { name: '', value: '' }]);
    };

    const handleVariableChange = (index: number, field: 'name' | 'value', fieldValue: string) => {
        const currentVariables = selectedBlock.params.variables || [];
        let finalValue = fieldValue;
        
        if (field === 'name') {
            // Reemplaza espacios por guiones bajos
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
        
        // Sincronizamos el estado de los popovers al borrar
        const newOpenState = openPopovers.filter((_, index) => index !== indexToRemove);
        setOpenPopovers(newOpenState);
        
        handleBlockParamChange(selectedBlock.id, 'variables', updatedVariables);
    };

    // --- LÓGICA DE FILTRADO Y CATEGORIZACIÓN ---
    
    // 1. Filtramos primero por lo que el usuario escribe en el buscador
    const filteredSuggestions = suggestions.filter(s => 
        typeof s.label === 'string' && s.label.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Definimos la condición: ¿Qué es una Variable? 
    // (Ajusta esta lógica si tienes otros criterios para definir variables vs bloques)
    const isVariable = (s: Suggestion) => {
        return s.value.startsWith('{{userInput}}') || 
               s.label.toString().toLowerCase().includes('set variable');
    };

    // 3. Separamos en dos listas distintas
    const variableSuggestions = filteredSuggestions.filter(isVariable);
    const blockSuggestions = filteredSuggestions.filter(s => !isVariable(s));


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">Set variable</h4>
                    <p className="text-sm text-muted-foreground">
                        Store values in variables to use later.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddVariable}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add variable
                </Button>
            </div>

            <div className="space-y-2">
                {(selectedBlock.params.variables || []).map((variable: any, index: number) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                        {/* COLUMNA 1: NOMBRE DE LA VARIABLE */}
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

                        {/* COLUMNA 2: VALOR (DROPDOWN CATEGORIZADO) */}
                        <div className="space-y-1.5">
                            <Label htmlFor={`variable-value-${selectedBlock.id}-${index}`}>
                                Value
                            </Label>
                            <Popover open={openPopovers[index]} onOpenChange={(open) => setPopoverOpen(index, open)}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between shadow-sm rounded-lg px-3"
                                    >
                                        <span className="truncate">
                                            {/* Intentamos mostrar el Label bonito, si no, el valor crudo */}
                                            {suggestions.find(s => s.value === variable.value)?.label || variable.value || "Select a value..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    {/* shouldFilter={false} es vital porque nosotros filtramos manualmente arriba */}
                                    <Command shouldFilter={false}>
                                        <CommandInput 
                                            placeholder="Search value..." 
                                            value={search} 
                                            onValueChange={setSearch} 
                                        />
                                        <CommandList>
                                            <CommandEmpty>No value found.</CommandEmpty>
                                            
                                            {/* GRUPO 1: VARIABLES */}
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

                                            {/* GRUPO 2: BLOCK RESULTS */}
                                            {blockSuggestions.length > 0 && (
                                                <CommandGroup heading="Block Results">
                                                    {blockSuggestions.map((suggestion) => (
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

                        {/* COLUMNA 3: BOTÓN ELIMINAR */}
                        {(selectedBlock.params.variables.length > 1) && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 mb-0.5" 
                                onClick={() => handleRemoveVariable(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}