
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2, PlusCircle, X, Trash2, FileText, File as FileIcon, MessagesSquare } from 'lucide-react';
import { AddTextDialog } from '@/components/add-text-dialog';
import { AddFileDialog } from '@/components/add-file-dialog';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';
import { useActiveAgent } from '../layout';
import { cn } from '@/lib/utils';
import { AddStarterDialog } from '@/components/add-starter-dialog';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateAgent } from '@/app/actions/agents';
import type { TextSource, AgentFile } from '@/lib/types';
import { deleteAgentText } from '@/app/actions/texts';
import { deleteAgentFile } from '@/app/actions/files';
import { Switch } from '@/components/ui/switch';


function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}


export default function TrainingPage() {
  const { activeAgent, setActiveAgent } = useActiveAgent();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [instructions, setInstructions] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isWelcomeMessageEnabled, setIsWelcomeMessageEnabled] = useState(true);
  const [starters, setStarters] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.4);
  const [isNameInvalid, setIsNameInvalid] = useState(false);
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

  const isChanged =
    activeAgent?.instructions !== instructions ||
    activeAgent?.welcomeMessage !== welcomeMessage ||
    activeAgent?.isWelcomeMessageEnabled !== isWelcomeMessageEnabled ||
    activeAgent?.temperature !== temperature ||
    JSON.stringify(activeAgent?.conversationStarters) !== JSON.stringify(starters) ||
    activeAgent?.rateLimiting?.maxMessages !== maxMessages ||
    activeAgent?.rateLimiting?.timeframe !== timeframe ||
    activeAgent?.rateLimiting?.limitExceededMessage !== limitExceededMessage;


  useEffect(() => {
    if (activeAgent) {
      setInstructions(activeAgent.instructions || '');
      setWelcomeMessage(activeAgent.welcomeMessage || 'Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!');
      setIsWelcomeMessageEnabled(activeAgent.isWelcomeMessageEnabled ?? true);
      setStarters(activeAgent.conversationStarters || []);
      setTemperature(activeAgent.temperature ?? 0.4);
      setIsNameInvalid(activeAgent.name.length < 3);
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
      setWelcomeMessage(activeAgent.welcomeMessage || 'Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!');
      setIsWelcomeMessageEnabled(activeAgent.isWelcomeMessageEnabled ?? true);
      setStarters(activeAgent.conversationStarters || []);
      setTemperature(activeAgent.temperature ?? 0.4);
      setMaxMessages(activeAgent.rateLimiting?.maxMessages ?? 20);
      setTimeframe(activeAgent.rateLimiting?.timeframe ?? 240);
      setLimitExceededMessage(activeAgent.rateLimiting?.limitExceededMessage ?? 'Too many messages in a row');
    }
  }

  const handleSaveChanges = () => {
    if (!user || !activeAgent?.id || isNameInvalid) return;

    startSavingTransition(async () => {
      const updatedData = {
        name: activeAgent.name,
        instructions: instructions,
        welcomeMessage: welcomeMessage,
        isWelcomeMessageEnabled: isWelcomeMessageEnabled,
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

  const currentAgentData = {
    name: activeAgent.name,
    instructions: instructions,
    welcomeMessage: welcomeMessage,
    isWelcomeMessageEnabled: isWelcomeMessageEnabled,
    temperature: temperature,
    conversationStarters: starters,
    textSources: textSources || [],
    fileSources: fileSources || [],
    rateLimiting: {
        maxMessages: maxMessages,
        timeframe: timeframe,
        limitExceededMessage: limitExceededMessage,
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            <Tabs defaultValue="instructions" className="flex flex-col flex-1 h-full">
               <div className="px-6 py-3 border-b">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="texts">Texts</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <TabsContent value="instructions" className="space-y-6 mt-0">
                    <div>
                      <Label htmlFor="instructions" className="text-base font-semibold">
                        Instructions
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="Give your agent a role and instructions..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="mt-2 min-h-[300px] text-sm font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="welcome-message" className="text-base font-semibold flex items-center gap-2">
                          Welcome Message
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <Switch
                          checked={isWelcomeMessageEnabled}
                          onCheckedChange={setIsWelcomeMessageEnabled}
                        />
                      </div>
                      <Textarea
                        id="welcome-message"
                        placeholder="Set a welcome message for your agent..."
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        className="mt-2 min-h-[100px]"
                        disabled={!isWelcomeMessageEnabled}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          Conversation starters
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <AddStarterDialog onAddStarter={handleAddStarter}>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </AddStarterDialog>
                      </div>
                       {starters.length === 0 ? (
                        <Card className="text-center">
                           <CardContent className="p-8">
                              <p className="font-semibold">No conversation starters yet</p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Add starter prompts to suggest below the chat input.
                              </p>
                              <AddStarterDialog onAddStarter={handleAddStarter}>
                                <Button variant="secondary" className="mt-4">
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add starter
                                </Button>
                              </AddStarterDialog>
                           </CardContent>
                        </Card>
                       ) : (
                         <ul className="space-y-2">
                            {starters.map((starter, index) => (
                              <li key={index} className="flex items-center justify-between text-sm p-3 border rounded-lg bg-muted/50 text-left">
                                <span className="truncate pr-4">{starter}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveStarter(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                         </ul>
                       )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="temperature" className="text-base font-semibold flex items-center gap-2">
                          Temperature
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <span className="text-sm font-medium">{temperature}</span>
                      </div>
                      <Slider
                        id="temperature"
                        value={[temperature]}
                        onValueChange={(value) => setTemperature(value[0])}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Consistent</span>
                        <span>Creative</span>
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
                      
                      {textsLoading ? (
                        <div className="text-center py-12">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Loading texts...</p>
                        </div>
                      ) : textSources && textSources.length > 0 ? (
                        <div className="space-y-3">
                          {textSources.map((text) => (
                            <Card key={text.id} className="flex items-center justify-between p-4">
                               <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium truncate">{text.title}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteText(text.id!)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </Card>
                          ))}
                        </div>
                      ) : (
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
                      )}
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
                      
                      {filesLoading ? (
                        <div className="text-center py-12">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Loading files...</p>
                        </div>
                      ) : fileSources && fileSources.length > 0 ? (
                        <div className="space-y-3">
                          {fileSources.map((file) => (
                            <Card key={file.id} className="flex items-center justify-between p-4">
                               <div className="flex items-center gap-3 overflow-hidden">
                                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-medium truncate" title={file.name}>{file.name}</span>
                                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteFile(file.id!)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </Card>
                          ))}
                        </div>
                      ) : (
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
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="mt-0 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">Rate limit</h3>
                        <p className="text-sm text-muted-foreground">
                          Limit the number of messages sent from one device on the iframe and chat bubble to prevent abuse.
                        </p>
                      </div>
                      <div className="space-y-6">
                          <div className="flex items-center gap-2 text-sm">
                              Limit to
                              <Input 
                                type="number" 
                                className="w-20" 
                                value={maxMessages} 
                                onChange={(e) => setMaxMessages(parseInt(e.target.value, 10) || 0)}
                              />
                              messages every
                              <Input 
                                type="number" 
                                className="w-24" 
                                value={timeframe}
                                onChange={(e) => setTimeframe(parseInt(e.target.value, 10) || 0)}
                              />
                              seconds.
                          </div>
                           <div>
                              <Label htmlFor="limit-message">Message to show when limit is hit</Label>
                              <Input
                                  id="limit-message"
                                  className="mt-2"
                                  value={limitExceededMessage}
                                  onChange={(e) => setLimitExceededMessage(e.target.value)}
                              />
                          </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-background">
                <Button variant="ghost" onClick={handleDiscardChanges} disabled={!isChanged || isSaving}>
                    Discard changes
                </Button>
                <Button onClick={handleSaveChanges} disabled={!isChanged || isNameInvalid || isSaving}>
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
              agentData={currentAgentData}
              mode="chat" 
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
