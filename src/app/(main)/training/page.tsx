

'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';
import { useActiveAgent } from '../layout';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateAgent } from '@/app/actions/agents';
import type { Agent, TextSource, AgentFile } from '@/lib/types';
import { deleteAgentText } from '@/app/actions/texts';
import { deleteAgentFile } from '@/app/actions/files';
import { InstructionSettings } from '@/components/training/InstructionSettings';
import { KnowledgeSources } from '@/components/training/KnowledgeSources';
import { SecuritySettings } from '@/components/training/SecuritySettings';
import { useKnowledgeUsage } from '@/hooks/use-knowledge-usage';


export default function TrainingPage() {
  const { activeAgent, setActiveAgent, userProfile } = useActiveAgent();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [instructions, setInstructions] = useState('');
  const [starters, setStarters] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.4);
  const [maxMessages, setMaxMessages] = useState(20);
  const [timeframe, setTimeframe] = useState(240);
  const [limitExceededMessage, setLimitExceededMessage] = useState('Too many messages in a row');

  const [isSaving, startSavingTransition] = useTransition();

  // Firestore query for agent texts
  const textsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'texts'));
  }, [user, activeAgent, firestore]);

  const { data: textSources, loading: textsLoading } = useCollection<TextSource>(textsQuery);

  // Firestore query for agent files
  const filesQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'files'));
  }, [user, activeAgent, firestore]);

  const { data: fileSources, loading: filesLoading } = useCollection<AgentFile>(filesQuery);
  
  const { isLimitReached, currentUsageKB, usageLimitKB } = useKnowledgeUsage(textSources, fileSources, userProfile);


  const isChanged =
    activeAgent?.instructions !== instructions ||
    activeAgent?.temperature !== temperature ||
    JSON.stringify(activeAgent?.conversationStarters) !== JSON.stringify(starters) ||
    activeAgent?.rateLimiting?.maxMessages !== maxMessages ||
    activeAgent?.rateLimiting?.timeframe !== timeframe ||
    activeAgent?.rateLimiting?.limitExceededMessage !== limitExceededMessage;


  useEffect(() => {
    if (activeAgent) {
      setInstructions(activeAgent.instructions || '');
      setStarters(activeAgent.conversationStarters || []);
      setTemperature(activeAgent.temperature ?? 0.4);
      setMaxMessages(activeAgent.rateLimiting?.maxMessages ?? 20);
      setTimeframe(activeAgent.rateLimiting?.timeframe ?? 240);
      setLimitExceededMessage(activeAgent.rateLimiting?.limitExceededMessage ?? 'Too many messages in a row');
    }
  }, [activeAgent]);
  
  const handleAddStarter = (starter: string) => {
    setStarters(prev => [...prev, starter]);
  };

  const handleRemoveStarter = (indexToRemove: number) => {
    setStarters(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDiscardChanges = () => {
    if (activeAgent) {
      setInstructions(activeAgent.instructions || '');
      setStarters(activeAgent.conversationStarters || []);
      setTemperature(activeAgent.temperature ?? 0.4);
      setMaxMessages(activeAgent.rateLimiting?.maxMessages ?? 20);
      setTimeframe(activeAgent.rateLimiting?.timeframe ?? 240);
      setLimitExceededMessage(activeAgent.rateLimiting?.limitExceededMessage ?? 'Too many messages in a row');
    }
  }

  const handleSaveChanges = () => {
    if (!user || !activeAgent?.id) return;

    startSavingTransition(async () => {
      const updatedData = {
        name: activeAgent.name,
        instructions: instructions,
        conversationStarters: starters,
        temperature: temperature,
        rateLimiting: {
            maxMessages: maxMessages,
            timeframe: timeframe,
            limitExceededMessage: limitExceededMessage,
        }
      };
      const result = await updateAgent(user.uid, activeAgent.id!, updatedData);

      if ('error' in result) {
        toast({ title: 'Failed to save changes', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Changes saved successfully!' });
        // Optimistically update the active agent in context
        setActiveAgent({ ...activeAgent, ...updatedData });
      }
    });
  };

  const handleDeleteText = async (textId: string) => {
    if (!user || !activeAgent?.id) return;
    const result = await deleteAgentText(user.uid, activeAgent.id, textId);
    if ('error' in result) {
      toast({ title: 'Failed to delete text', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Text deleted successfully.' });
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!user || !activeAgent?.id) return;
    const result = await deleteAgentFile(user.uid, activeAgent.id, fileId);
    if ('error' in result) {
      toast({ title: 'Failed to delete file', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'File deleted successfully.' });
    }
  }
  
  if (!activeAgent) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading agent data...</p>
        </div>
      </div>
    );
  }

  const agentForPreview: Agent = {
    ...activeAgent,
    instructions: instructions,
    temperature: temperature,
    conversationStarters: starters,
    rateLimiting: {
        maxMessages: maxMessages,
        timeframe: timeframe,
        limitExceededMessage: limitExceededMessage,
    },
    textSources: textSources || [],
    fileSources: fileSources || [],
  };

  return (
    <div className="h-full flex-1 flex flex-col">
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
                        handleAddStarter={handleAddStarter}
                        handleRemoveStarter={handleRemoveStarter}
                        temperature={temperature}
                        setTemperature={setTemperature}
                    />
                  </TabsContent>

                  <TabsContent value="texts" className="mt-0 space-y-6">
                      <KnowledgeSources
                        sourceType="text"
                        textSources={textSources || []}
                        fileSources={[]}
                        textsLoading={textsLoading}
                        filesLoading={false}
                        handleDeleteText={handleDeleteText}
                        handleDeleteFile={() => {}}
                        isLimitReached={isLimitReached}
                        currentUsageKB={currentUsageKB}
                        usageLimitKB={usageLimitKB}
                    />
                  </TabsContent>

                   <TabsContent value="files" className="mt-0 space-y-6">
                     <KnowledgeSources
                        sourceType="file"
                        textSources={[]}
                        fileSources={fileSources || []}
                        textsLoading={false}
                        filesLoading={filesLoading}
                        handleDeleteText={() => {}}
                        handleDeleteFile={handleDeleteFile}
                        isLimitReached={isLimitReached}
                        currentUsageKB={currentUsageKB}
                        usageLimitKB={usageLimitKB}
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
                <Button variant="ghost" onClick={handleDiscardChanges} disabled={!isChanged || isSaving}>
                    Discard changes
                </Button>
                <Button className="flex-1 max-w-xs" onClick={handleSaveChanges} disabled={!isChanged || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
