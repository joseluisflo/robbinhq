'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Info,
  PlusCircle,
} from 'lucide-react';
import { AddTextDialog } from '@/components/add-text-dialog';
import { AddFileDialog } from '@/components/add-file-dialog';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';

const instructionsPlaceholder = `### Role
You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.

### Persona
You are a dedicated customer support agent. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to customer support.

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are outside of your defined role.
`;

export default function TrainingPage() {
  const [agentName, setAgentName] = useState('Agent Preview');
  
  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            <Tabs defaultValue="instructions" className="flex flex-col flex-1 h-full">
               <div className="px-6 py-3 border-b">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="texts">Texts</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="websites">Websites</TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <TabsContent value="instructions" className="space-y-6 mt-0">
                    <div className="space-y-2">
                        <Label htmlFor="agent-name">Agent Name</Label>
                        <Input
                          id="agent-name"
                          placeholder="e.g., Customer Support Bot"
                          value={agentName === 'Agent Preview' ? '' : agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                        />
                      </div>
                    <div>
                      <Label htmlFor="instructions" className="text-base font-semibold">
                        Instructions
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="Give your agent a role and instructions..."
                        defaultValue={instructionsPlaceholder}
                        className="mt-2 min-h-[300px] text-sm font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          Conversation starters
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <Button variant="outline" size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                      <Card className="text-center">
                        <CardContent className="p-8">
                          <p className="font-semibold">No conversation starters yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Add starter prompts to suggest below the chat input.
                          </p>
                          <Button variant="secondary" className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add starter
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="temperature" className="text-base font-semibold flex items-center gap-2">
                          Temperature
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <span className="text-sm font-medium">0</span>
                      </div>
                      <Slider
                        id="temperature"
                        defaultValue={[0]}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Consistent</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Capabilities</Label>
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="web-search" className="text-sm font-medium">Web search</Label>
                          </div>
                          <Switch id="web-search" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="image-generation" className="text-sm font-medium">Image generation</Label>
                          </div>
                          <Switch id="image-generation" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="texts" className="mt-0 h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          Texts
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <AddTextDialog>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </AddTextDialog>
                      </div>
                      <Card className="text-center flex-1 flex flex-col justify-center min-h-[400px]">
                        <CardContent className="p-12">
                          <p className="font-semibold">No texts added yet</p>
                          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                            Add training texts to provide your AI agent with specific knowledge and information.
                          </p>
                           <AddTextDialog>
                            <Button variant="secondary" className="mt-4">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add text
                            </Button>
                          </AddTextDialog>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="mt-0">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          Files
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                         <AddFileDialog>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </AddFileDialog>
                      </div>
                      <Card className="text-center flex-1 flex flex-col justify-center min-h-[400px]">
                        <CardContent className="p-12">
                          <p className="font-semibold">No files added yet</p>
                          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                            Upload files to train your AI agent with documents and resources.
                          </p>
                          <AddFileDialog>
                            <Button variant="secondary" className="mt-4">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Upload file
                            </Button>
                          </AddFileDialog>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="websites" className="mt-0">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          Websites
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <Button variant="outline" size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                      <Card className="text-center flex-1 flex flex-col justify-center min-h-[400px]">
                        <CardContent className="p-12">
                          <p className="font-semibold">No websites added yet</p>
                          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                            Add website URLs to train your AI agent with web content.
                          </p>
                          <Button variant="secondary" className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add website
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-background">
                <Button variant="ghost">Discard changes</Button>
                <Button>Save changes</Button>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full items-center justify-center p-8 bg-muted/30">
            <ChatWidgetPreview agentName={agentName} mode="chat" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
