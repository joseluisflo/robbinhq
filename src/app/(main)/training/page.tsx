'use client';

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
import { Info, PlusCircle, ArrowUp, Paperclip } from 'lucide-react';

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
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full flex-col p-1 pr-6">
          <div className="flex items-center justify-between p-2">
            <h2 className="text-3xl font-bold tracking-tight">Training</h2>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Tabs defaultValue="instructions" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="texts">Texts</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="websites">Websites</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto mt-4 px-2 pr-2">
                <TabsContent value="instructions" className="space-y-6">
                  <div>
                    <Label htmlFor="instructions" className="text-lg font-semibold">
                      Instructions
                    </Label>
                    <Textarea
                      id="instructions"
                      placeholder="Give your agent a role and instructions..."
                      defaultValue={instructionsPlaceholder}
                      className="mt-2 min-h-[300px] text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        Conversation starters
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Label>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <Card className="mt-2 text-center bg-card">
                      <CardContent className="p-6">
                        <p className="font-semibold">No conversation starters yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature" className="text-lg font-semibold flex items-center gap-2">
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
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Consistent</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold">Capabilities</Label>
                    <div className="space-y-4 mt-2">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="web-search" className="text-base">Web search</Label>
                        </div>
                        <Switch id="web-search" />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="image-generation" className="text-base">Image generation</Label>
                        </div>
                        <Switch id="image-generation" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="texts" className="h-full mt-0">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between pb-4">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        Texts
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Label>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <Card className="flex-1 flex items-center justify-center text-center bg-card">
                      <CardContent className="p-6">
                        <p className="font-semibold">No texts added yet</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          Add training texts to provide your AI agent with specific knowledge and information.
                        </p>
                        <Button variant="secondary" className="mt-4">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add text
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="flex justify-end gap-2 p-2 border-t mt-auto">
              <Button variant="ghost">Discard changes</Button>
              <Button>Save changes</Button>
            </div>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full flex-col justify-between items-center p-6 bg-muted/30 rounded-lg border">
          <div className="w-full flex-1">
            {/* Chat messages would go here */}
          </div>
          <div className="w-full max-w-2xl">
            <div className="relative">
              <Input placeholder="Ask anything" className="h-12 pl-12 pr-12 text-base" />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span>0 Files</span>
                </Button>
              </div>
              <Button variant="default" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 p-0">
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              <Button variant="link" className="text-xs p-0 h-auto">Reset thread</Button>
            </p>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
