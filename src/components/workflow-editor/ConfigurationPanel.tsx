'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, X } from 'lucide-react';
import type { WorkflowBlock } from '@/lib/types';
import { AddBlockPopover } from '@/components/add-block-popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tag, TagInput, type Suggestion } from '../ui/tag-input';

const blockGroups: Record<string, string> = {
  Trigger: 'Core',
  'Ask a question': 'Tools',
  'Wait for User Reply': 'Tools',
  'Show Multiple Choice': 'Tools',
  'Search web': 'Tools',
  'Send Email': 'Tools',
  'Send SMS': 'Tools',
  'Create PDF': 'Tools',
  Condition: 'Logic',
  Loop: 'Logic',
  'Set variable': 'Data',
};

interface ConfigurationPanelProps {
  selectedBlock: WorkflowBlock | undefined;
  allBlocks: WorkflowBlock[]; // We need all blocks to populate the selector
  handleBlockParamChange: (
    blockId: string,
    paramName: string,
    value: any
  ) => void;
  onAddBlock: (blockType: string) => void;
  isSaving: boolean;
  isChanged: boolean;
  handleSaveChanges: () => void;
  handleDiscardChanges: () => void;
}

export function ConfigurationPanel({
  selectedBlock,
  allBlocks,
  handleBlockParamChange,
  onAddBlock,
  isSaving,
  isChanged,
  handleSaveChanges,
  handleDiscardChanges,
}: ConfigurationPanelProps) {
  const [newOption, setNewOption] = useState('');
  const [emailTags, setEmailTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedBlock?.type === 'Send Email') {
        const toValue = selectedBlock.params.to;
        if (typeof toValue === 'string' && toValue) {
            setEmailTags(toValue.split(',').map((email, i) => ({ id: `${i}`, text: email.trim() })));
        } else if (Array.isArray(toValue)) {
            setEmailTags(toValue.map((email, i) => ({ id: `${i}`, text: email.trim() })));
        } 
        else {
            setEmailTags([]);
        }
    }
  }, [selectedBlock]);

  useEffect(() => {
    if (selectedBlock?.type === 'Set variable') {
      const currentVariables = selectedBlock.params.variables;
      if (!currentVariables || !Array.isArray(currentVariables) || currentVariables.length === 0) {
        handleBlockParamChange(selectedBlock.id, 'variables', [{ name: '', value: '' }]);
      }
    }
  }, [selectedBlock, handleBlockParamChange]);


  const handleAddOption = () => {
    if (newOption.trim() && selectedBlock) {
      const currentOptions = selectedBlock.params.options || [];
      handleBlockParamChange(selectedBlock.id, 'options', [...currentOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (selectedBlock) {
      const currentOptions = selectedBlock.params.options || [];
      const updatedOptions = currentOptions.filter((_: any, index: number) => index !== indexToRemove);
      handleBlockParamChange(selectedBlock.id, 'options', updatedOptions);
    }
  };

    const handleAddVariable = () => {
        if (selectedBlock) {
            const currentVariables = selectedBlock.params.variables || [];
            handleBlockParamChange(selectedBlock.id, 'variables', [...currentVariables, { name: '', value: '' }]);
        }
    };

    const handleVariableChange = (index: number, field: 'name' | 'value', fieldValue: string) => {
        if (selectedBlock) {
            const currentVariables = selectedBlock.params.variables || [];
            
            let finalValue = fieldValue;
            if (field === 'name') {
                finalValue = fieldValue.replace(/\s+/g, '_');
            }

            const updatedVariables = currentVariables.map((v: any, i: number) => 
                i === index ? { ...v, [field]: finalValue } : v
            );
            handleBlockParamChange(selectedBlock.id, 'variables', updatedVariables);
        }
    };

    const handleRemoveVariable = (indexToRemove: number) => {
        if (selectedBlock) {
            const currentVariables = selectedBlock.params.variables || [];
            if (currentVariables.length <= 1) return;
            const updatedVariables = currentVariables.filter((_: any, index: number) => index !== indexToRemove);
            handleBlockParamChange(selectedBlock.id, 'variables', updatedVariables);
        }
    };


  const getResultKeyForBlock = (blockType: string) => {
    switch (blockType) {
      case 'Ask a question':
      case 'Wait for User Reply':
      case 'Show Multiple Choice':
        return 'answer';
      case 'Search web':
        return 'summary';
      case 'Send Email':
      case 'Send SMS':
        return 'status';
      case 'Create PDF':
        return 'pdfBase64';
      case 'Set variable':
        return ''; // Direct value
      default:
        return 'result'; // Fallback
    }
  };
  
  const availableVariables = selectedBlock 
    ? allBlocks.slice(0, allBlocks.findIndex(b => b.id === selectedBlock.id))
               .filter(b => b.type !== 'Trigger' && b.type !== 'Wait for User Reply')
    : [];
    
  const suggestions: Suggestion[] = availableVariables.flatMap(block => {
    if (block.type === 'Set variable') {
        return (block.params.variables || []).map((v: any) => ({
            value: `{{${v.name}}}`,
            label: <span className="flex items-center gap-2">Set variable: <span className="font-semibold">{v.name}</span></span>,
        }));
    } else {
        const resultKey = getResultKeyForBlock(block.type);
        const value = resultKey ? `{{${block.id}.${resultKey}}}` : `{{${block.id}}}`;
        return {
            value: value,
            label: `Result of "${block.type}" (${block.id})`,
        }
    }
  });
  
  suggestions.unshift({ value: '{{userInput}}', label: 'Initial User Input' });


  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 h-8">
            {selectedBlock ? (
              <>
                <span>{selectedBlock.type}</span>
                <span className="text-sm font-mono text-muted-foreground">({selectedBlock.id})</span>
              </>
            ) : null}
          </h3>
        </div>

        {!selectedBlock ? (
          <div className="text-center text-muted-foreground pt-12">
            <p>Select a block from the canvas to configure it.</p>
            <AddBlockPopover onAddBlock={onAddBlock}>
              <Button variant="secondary" className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add block
              </Button>
            </AddBlockPopover>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedBlock.type === 'Trigger' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">When to use</h4>
                  <p className="text-sm text-muted-foreground">
                    Describe when the agent should use this workflow. Be
                    specific and descriptive.
                  </p>
                </div>
                <div>
                  <Label
                    htmlFor={`trigger-description-${selectedBlock.id}`}
                    className="sr-only"
                  >
                    When to use description
                  </Label>
                  <Textarea
                    id={`trigger-description-${selectedBlock.id}`}
                    placeholder="e.g. When the user asks to create a new marketing campaign..."
                    className="min-h-[100px]"
                    value={selectedBlock.params.description || ''}
                    onChange={(e) =>
                      handleBlockParamChange(
                        selectedBlock.id,
                        'description',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}
            {selectedBlock.type === 'Ask a question' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Ask a question</h4>
                  <p className="text-sm text-muted-foreground">
                    Prompt the user for specific information.
                  </p>
                </div>
                <div>
                  <Label
                    htmlFor={`ask-a-question-prompt-${selectedBlock.id}`}
                    className="sr-only"
                  >
                    Question to ask
                  </Label>
                  <Textarea
                    id={`ask-a-question-prompt-${selectedBlock.id}`}
                    placeholder="e.g. What is your email address?"
                    className="min-h-[100px]"
                    value={selectedBlock.params.prompt || ''}
                    onChange={(e) =>
                      handleBlockParamChange(
                        selectedBlock.id,
                        'prompt',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}
            {selectedBlock.type === 'Show Multiple Choice' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Show Multiple Choice</h4>
                  <p className="text-sm text-muted-foreground">
                    Present the user with a set of options to choose from.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`multiple-choice-prompt-${selectedBlock.id}`}>
                    Prompt
                  </Label>
                  <Textarea
                    id={`multiple-choice-prompt-${selectedBlock.id}`}
                    placeholder="e.g. What would you like to do next?"
                    value={selectedBlock.params.prompt || ''}
                    onChange={(e) => handleBlockParamChange(selectedBlock.id, 'prompt', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                   <ul className="space-y-2">
                      {(selectedBlock.params.options || []).map((option: string, index: number) => (
                        <li key={index} className="flex items-center justify-between text-sm p-2 border rounded-md bg-muted/50">
                          <span className="truncate pr-2">{option}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveOption(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a new option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                       onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption();
                        }
                      }}
                    />
                    <Button onClick={handleAddOption} disabled={!newOption.trim()}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {selectedBlock.type === 'Search web' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Search web</h4>
                  <p className="text-sm text-muted-foreground">
                    Define what the agent should search for on the internet.
                  </p>
                </div>
                <div>
                  <Label
                    htmlFor={`search-web-query-${selectedBlock.id}`}
                    className="sr-only"
                  >
                    Search query
                  </Label>
                  <Textarea
                    id={`search-web-query-${selectedBlock.id}`}
                    placeholder="e.g. Latest trends in AI development"
                    className="min-h-[100px]"
                    value={selectedBlock.params.query || ''}
                    onChange={(e) =>
                      handleBlockParamChange(
                        selectedBlock.id,
                        'query',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}
            {selectedBlock.type === 'Set variable' && (
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
                                <Select
                                value={variable.value || ''}
                                onValueChange={(value) => handleVariableChange(index, 'value', value)}
                                >
                                <SelectTrigger className="shadow-sm">
                                    <SelectValue placeholder="Select a value..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="{{userInput}}">
                                    Initial User Input
                                    </SelectItem>
                                    {availableVariables.map(block => {
                                        const resultKey = getResultKeyForBlock(block.type);
                                        const variable = resultKey ? `{{${block.id}.${resultKey}}}` : `{{${block.id}}}`;
                                        return (
                                            <SelectItem key={block.id} value={variable}>
                                                Result of &quot;{block.type}&quot; ({block.id})
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                                </Select>
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
            )}
            {selectedBlock.type === 'Send Email' && (
              <div className="space-y-4">
                <div>
                    <h4 className="font-semibold">Send Email</h4>
                    <p className="text-sm text-muted-foreground">
                        Send an email to a specified recipient.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`email-to-${selectedBlock.id}`}>To</Label>
                        <TagInput
                            id={`email-to-${selectedBlock.id}`}
                            placeholder="Add recipient or type @ for variables..."
                            tags={emailTags}
                            setTags={(newTags) => {
                                const newEmails = newTags.map(tag => tag.text).join(', ');
                                handleBlockParamChange(selectedBlock.id, 'to', newEmails);
                            }}
                            activeTagIndex={activeTagIndex}
                            setActiveTagIndex={setActiveTagIndex}
                            suggestions={suggestions}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`email-subject-${selectedBlock.id}`}>
                        Subject
                        </Label>
                        <Input
                        id={`email-subject-${selectedBlock.id}`}
                        placeholder="Your email subject"
                        value={selectedBlock.params.subject || ''}
                        onChange={(e) =>
                            handleBlockParamChange(
                            selectedBlock.id,
                            'subject',
                            e.target.value
                            )
                        }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`email-body-${selectedBlock.id}`}>
                        Body
                        </Label>
                        <Textarea
                        id={`email-body-${selectedBlock.id}`}
                        placeholder="Write your email content here."
                        className="min-h-[120px]"
                        value={selectedBlock.params.body || ''}
                        onChange={(e) =>
                            handleBlockParamChange(
                            selectedBlock.id,
                            'body',
                            e.target.value
                            )
                        }
                        />
                    </div>
                </div>
              </div>
            )}
            {selectedBlock.type === 'Send SMS' && (
              <div className="space-y-4">
                <div>
                    <h4 className="font-semibold">Send SMS</h4>
                    <p className="text-sm text-muted-foreground">
                        Send an SMS to a specified phone number.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`sms-to-${selectedBlock.id}`}>To</Label>
                        <Input
                        id={`sms-to-${selectedBlock.id}`}
                        placeholder="Phone number or {{variableName}}"
                        value={selectedBlock.params.to || ''}
                        onChange={(e) =>
                            handleBlockParamChange(
                            selectedBlock.id,
                            'to',
                            e.target.value
                            )
                        }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`sms-message-${selectedBlock.id}`}>
                        Message
                        </Label>
                        <Textarea
                        id={`sms-message-${selectedBlock.id}`}
                        placeholder="Write your SMS content here."
                        className="min-h-[120px]"
                        value={selectedBlock.params.message || ''}
                        onChange={(e) =>
                            handleBlockParamChange(
                            selectedBlock.id,
                            'message',
                            e.target.value
                            )
                        }
                        />
                    </div>
                </div>
              </div>
            )}
             {selectedBlock.type === 'Create PDF' && (
              <div className="space-y-4">
                <div>
                    <h4 className="font-semibold">Create PDF</h4>
                    <p className="text-sm text-muted-foreground">
                        Generate a PDF document from text content.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`pdf-content-${selectedBlock.id}`}>Content</Label>
                    <Textarea
                    id={`pdf-content-${selectedBlock.id}`}
                    placeholder="Enter the text content for the PDF."
                    className="min-h-[200px]"
                    value={selectedBlock.params.content || ''}
                    onChange={(e) =>
                        handleBlockParamChange(
                        selectedBlock.id,
                        'content',
                        e.target.value
                        )
                    }
                    />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex w-full items-center justify-between gap-3 px-6 py-4 border-t bg-background">
        <Button
          variant="ghost"
          onClick={handleDiscardChanges}
          disabled={!isChanged || isSaving}
        >
          Discard changes
        </Button>

        <Button
          className="flex-1 max-w-xs"
          onClick={handleSaveChanges}
          disabled={!isChanged || isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
