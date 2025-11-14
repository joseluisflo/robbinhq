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
            {selectedBlock ? selectedBlock.type : ''}
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
                <div>
                    <h4 className="font-semibold">Set variable</h4>
                    <p className="text-sm text-muted-foreground">
                        Store a value in a variable to use later in the workflow.
                    </p>
                </div>
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
