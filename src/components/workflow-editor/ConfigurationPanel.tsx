'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import type { WorkflowBlock } from '@/lib/types';
import { AddBlockPopover } from '@/components/add-block-popover';

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
  handleBlockParamChange,
  onAddBlock,
  isSaving,
  isChanged,
  handleSaveChanges,
  handleDiscardChanges,
}: ConfigurationPanelProps) {
  const selectedBlockGroup = selectedBlock
    ? blockGroups[selectedBlock.type]
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 h-8">
            {selectedBlockGroup || ''}
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
          <div>
            {selectedBlock.type === 'Trigger' && (
              <Card>
                <CardHeader>
                  <CardTitle>When to use</CardTitle>
                  <CardDescription>
                    Describe when the agent should use this workflow. Be
                    specific and descriptive.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
            {selectedBlock.type === 'Ask a question' && (
              <Card>
                <CardHeader>
                  <CardTitle>Ask a question</CardTitle>
                  <CardDescription>
                    Prompt the user for specific information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
            {selectedBlock.type === 'Search web' && (
              <Card>
                <CardHeader>
                  <CardTitle>Search web</CardTitle>
                  <CardDescription>
                    Define what the agent should search for on the internet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
            {selectedBlock.type === 'Set variable' && (
              <Card>
                <CardHeader>
                  <CardTitle>Set variable</CardTitle>
                  <CardDescription>
                    Store a value in a variable to use later in the workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`variable-name-${selectedBlock.id}`}>
                        Variable Name
                      </Label>
                      <Input
                        id={`variable-name-${selectedBlock.id}`}
                        placeholder="e.g. userEmail"
                        value={selectedBlock.params.variableName || ''}
                        onChange={(e) =>
                          handleBlockParamChange(
                            selectedBlock.id,
                            'variableName',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variable-value-${selectedBlock.id}`}>
                        Value
                      </Label>
                      <Input
                        id={`variable-value-${selectedBlock.id}`}
                        placeholder="e.g. '{{answer_from_previous_step}}' "
                        value={selectedBlock.params.value || ''}
                        onChange={(e) =>
                          handleBlockParamChange(
                            selectedBlock.id,
                            'value',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedBlock.type === 'Send Email' && (
              <Card>
                <CardHeader>
                  <CardTitle>Send Email</CardTitle>
                  <CardDescription>
                    Send an email to a specified recipient.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`email-to-${selectedBlock.id}`}>To</Label>
                    <Input
                      id={`email-to-${selectedBlock.id}`}
                      placeholder="recipient@example.com or {{variableName}}"
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
                </CardContent>
              </Card>
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
