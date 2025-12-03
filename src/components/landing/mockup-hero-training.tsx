
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';
import type { Agent, TextSource, AgentFile } from '@/lib/types';
import { InstructionSettings } from '@/components/training/InstructionSettings';
import { KnowledgeSources } from '@/components/training/KnowledgeSources';
import { SecuritySettings } from '@/components/training/SecuritySettings';

const mockAgent: Agent = {
    id: 'mock-agent-1',
    name: 'Fitness Assistant',
    description: 'An assistant that suggests bodyweight workouts and meal plans.',
    instructions: `### Role
You are a friendly and motivating fitness assistant.

### Persona
- Encouraging and positive.
- Knowledgeable about fitness and nutrition.
- You avoid giving medical advice.

### Constraints
- Only provide bodyweight exercises.
- Keep meal suggestions simple and healthy.`,
    goals: [],
    status: 'idle',
    tasks: [],
    conversationStarters: [
        'Suggest a 5-minute workout',
        'What is a healthy breakfast?',
        'How can I improve my posture?',
    ],
    temperature: 0.5,
};

const mockTextSources: TextSource[] = [
    { id: 'text-1', title: 'Return Policy', content: '...', createdAt: new Date() },
    { id: 'text-2', title: 'About Us', content: '...', createdAt: new Date() },
];

const mockFileSources: AgentFile[] = [
    { id: 'file-1', name: 'Product Catalog.pdf', type: 'application/pdf', size: 2345678, url: '#', storagePath: '', createdAt: new Date() },
    { id: 'file-2', name: 'Onboarding Guide.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 890123, url: '#', storagePath: '', createdAt: new Date() },
];


export function MockupHeroTraining() {
  const [instructions, setInstructions] = useState(mockAgent.instructions || '');
  const [starters, setStarters] = useState(mockAgent.conversationStarters || []);
  const [temperature, setTemperature] = useState(mockAgent.temperature || 0.4);
  const [maxMessages, setMaxMessages] = useState(20);
  const [timeframe, setTimeframe] = useState(240);
  const [limitExceededMessage, setLimitExceededMessage] = useState('Too many messages in a row');


  const agentForPreview: Agent = {
    ...mockAgent,
    instructions,
    temperature,
    conversationStarters: starters,
    textSources: mockTextSources,
    fileSources: mockFileSources,
  };

  return (
    <div className="h-[700px] flex-1 flex flex-col bg-background">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            <Tabs defaultValue="instructions" className="flex flex-col flex-1 h-full">
               <div className="px-6 py-3 border-b flex items-center justify-between">
                <TabsList className="grid w-full grid-cols-4 max-w-lg">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="texts">Texts</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <TabsContent value="instructions" className="space-y-6 mt-0">
                    <InstructionSettings
                        instructions={instructions}
                        setInstructions={setInstructions}
                        starters={starters}
                        handleAddStarter={(s) => setStarters(p => [...p, s])}
                        handleRemoveStarter={(i) => setStarters(p => p.filter((_, idx) => idx !== i))}
                        temperature={temperature}
                        setTemperature={setTemperature}
                    />
                  </TabsContent>

                  <TabsContent value="texts" className="mt-0 space-y-6">
                      <KnowledgeSources
                        sourceType="text"
                        textSources={mockTextSources}
                        fileSources={[]}
                        textsLoading={false}
                        filesLoading={false}
                        handleDeleteText={() => {}}
                        handleDeleteFile={() => {}}
                        isLimitReached={false}
                        currentUsageKB={150}
                        usageLimitKB={400}
                    />
                  </TabsContent>

                   <TabsContent value="files" className="mt-0 space-y-6">
                     <KnowledgeSources
                        sourceType="file"
                        textSources={[]}
                        fileSources={mockFileSources}
                        textsLoading={false}
                        filesLoading={false}
                        handleDeleteText={() => {}}
                        handleDeleteFile={() => {}}
                        isLimitReached={false}
                        currentUsageKB={150}
                        usageLimitKB={400}
                    />
                  </TabsContent>

                  <TabsContent value="security" className="mt-0 space-y-6">
                    <SecuritySettings
                        maxMessages={maxMessages}
                        timeframe={timeframe}
                        limitExceededMessage={limitExceededMessage}
                        setMaxMessages={setMaxMessages}
                        setTimeframe={setTimeframe}
                        setLimitExceededMessage={setLimitExceededMessage}
                    />
                  </TabsContent>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-background">
                <Button variant="ghost" disabled>
                    Discard changes
                </Button>
                <Button className="flex-1 max-w-xs" disabled>
                    Save changes
                </Button>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full items-center justify-center p-8 bg-muted/30">
            <ChatWidgetPreview 
              agent={agentForPreview}
              mode="chat" 
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
