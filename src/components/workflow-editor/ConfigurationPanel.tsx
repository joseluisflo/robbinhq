'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import type { WorkflowBlock } from '@/lib/types';
import { AddBlockPopover } from '@/components/add-block-popover';
import type { Suggestion } from '../ui/tag-input';

import { TriggerConfiguration } from './configurations/TriggerConfiguration';
import { AskQuestionConfiguration } from './configurations/AskQuestionConfiguration';
import { ShowMultipleChoiceConfiguration } from './configurations/ShowMultipleChoiceConfiguration';
import { SearchWebConfiguration } from './configurations/SearchWebConfiguration';
import { SendEmailConfiguration } from './configurations/SendEmailConfiguration';
import { SendSmsConfiguration } from './configurations/SendSmsConfiguration';
import { CreatePdfConfiguration } from './configurations/CreatePdfConfiguration';
import { SetVariableConfiguration } from './configurations/SetVariableConfiguration';


interface BlockConfigurationProps {
  selectedBlock: WorkflowBlock;
  handleBlockParamChange: (blockId: string, paramName: string, value: any) => void;
  suggestions: Suggestion[];
}

const BlockConfigurations: { [key: string]: React.FC<BlockConfigurationProps> } = {
  'Trigger': TriggerConfiguration,
  'Ask a question': AskQuestionConfiguration,
  'Show Multiple Choice': ShowMultipleChoiceConfiguration,
  'Search web': SearchWebConfiguration,
  'Send Email': SendEmailConfiguration,
  'Send SMS': SendSmsConfiguration,
  'Create PDF': CreatePdfConfiguration,
  'Set variable': SetVariableConfiguration,
};


interface ConfigurationPanelProps {
  selectedBlock: WorkflowBlock | undefined;
  allBlocks: WorkflowBlock[];
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
  
  useEffect(() => {
    if (selectedBlock?.type === 'Set variable') {
      const currentVariables = selectedBlock.params.variables;
      if (!currentVariables || !Array.isArray(currentVariables) || currentVariables.length === 0) {
        handleBlockParamChange(selectedBlock.id, 'variables', [{ name: '', value: '' }]);
      }
    }
  }, [selectedBlock, handleBlockParamChange]);

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
        return '';
      default:
        return 'result';
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
  
  const SelectedBlockComponent = selectedBlock ? BlockConfigurations[selectedBlock.type] : null;


  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
          <div>
            {SelectedBlockComponent ? (
              <SelectedBlockComponent 
                selectedBlock={selectedBlock}
                handleBlockParamChange={handleBlockParamChange}
                suggestions={suggestions}
              />
            ) : (
              <div className="text-center text-muted-foreground pt-12">
                <p>Configuration for this block type is not yet available.</p>
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