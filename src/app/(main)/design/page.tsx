

'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveAgent } from '../layout';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { LogoUploader } from '@/components/logo-uploader';
import { Info, Loader2, Phone, PhoneOff } from 'lucide-react';
import { updateAgent } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import { ColorPicker } from '@/components/custom/color-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLiveAgent } from '@/hooks/use-live-agent';


export default function DesignPage() {
  const { activeAgent, setActiveAgent } = useActiveAgent();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { connectionState, toggleCall } = useLiveAgent();
  
  const [agentName, setAgentName] = useState('');
  const [isDisplayNameEnabled, setIsDisplayNameEnabled] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [themeColor, setThemeColor] = useState('#16a34a');
  const [chatButtonColor, setChatButtonColor] = useState('#16a34a');
  const [chatBubbleAlignment, setChatBubbleAlignment] = useState<'left' | 'right'>('right');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [inCallWelcomeMessage, setInCallWelcomeMessage] = useState('');
  const [isWelcomeMessageEnabled, setIsWelcomeMessageEnabled] = useState(true);
  const [chatPlaceholder, setChatPlaceholder] = useState('');
  const [isFeedbackEnabled, setIsFeedbackEnabled] = useState(true);
  const [isBargeInEnabled, setIsBargeInEnabled] = useState(true);
  const [isBrandingEnabled, setIsBrandingEnabled] = useState(true);
  const [agentVoice, setAgentVoice] = useState('Zephyr');
  const [orbColors, setOrbColors] = useState({
    bg: 'oklch(95% 0.02 264.695)',
    c1: 'oklch(75% 0.15 350)',
    c2: 'oklch(80% 0.12 200)',
    c3: 'oklch(78% 0.14 280)',
  });


  const [isSaving, startSaving] = useTransition();

  // Firestore query for agent texts
  const textsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'texts'));
  }, [user, activeAgent, firestore]);

  const { data: textSources } = useCollection<TextSource>(textsQuery);

  // Firestore query for agent files
  const filesQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'files'));
  }, [user, activeAgent, firestore]);

  const { data: fileSources } = useCollection<AgentFile>(filesQuery);

  const isChanged = 
    agentName !== (activeAgent?.name || '') ||
    isDisplayNameEnabled !== (activeAgent?.isDisplayNameEnabled ?? true) ||
    logoFile !== null ||
    themeColor !== (activeAgent?.themeColor || '#16a34a') ||
    chatButtonColor !== (activeAgent?.chatButtonColor || '#16a34a') ||
    chatBubbleAlignment !== (activeAgent?.chatBubbleAlignment || 'right') ||
    welcomeMessage !== (activeAgent?.welcomeMessage || '') ||
    inCallWelcomeMessage !== (activeAgent?.inCallWelcomeMessage || '') ||
    isWelcomeMessageEnabled !== (activeAgent?.isWelcomeMessageEnabled ?? true) ||
    chatPlaceholder !== (activeAgent?.chatInputPlaceholder || '') ||
    isFeedbackEnabled !== (activeAgent?.isFeedbackEnabled ?? true) ||
    isBargeInEnabled !== (activeAgent?.isBargeInEnabled ?? true) ||
    isBrandingEnabled !== (activeAgent?.isBrandingEnabled ?? true) ||
    agentVoice !== (activeAgent?.agentVoice || 'Zephyr');


  useEffect(() => {
    if (activeAgent) {
      setAgentName(activeAgent.name);
      setIsDisplayNameEnabled(activeAgent.isDisplayNameEnabled ?? true);
      setThemeColor(activeAgent.themeColor || '#16a34a');
      setChatButtonColor(activeAgent.chatButtonColor || activeAgent.themeColor || '#16a34a');
      setChatBubbleAlignment(activeAgent.chatBubbleAlignment || 'right');
      setWelcomeMessage(activeAgent.welcomeMessage || 'Hello! You are talking to the preview agent. Ask me a question to get started!');
      setInCallWelcomeMessage(activeAgent.inCallWelcomeMessage || 'Hello, how can I help you today?');
      setIsWelcomeMessageEnabled(activeAgent.isWelcomeMessageEnabled ?? true);
      setChatPlaceholder(activeAgent.chatInputPlaceholder || 'Ask anything');
      setIsFeedbackEnabled(activeAgent.isFeedbackEnabled ?? true);
      setIsBargeInEnabled(activeAgent.isBargeInEnabled ?? true);
      setIsBrandingEnabled(activeAgent.isBrandingEnabled ?? true);
      setAgentVoice(activeAgent.agentVoice || 'Zephyr');
      setLogoFile(null); // Reset file on agent change
    }
  }, [activeAgent]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setAgentName(newName);
  };

  const handleDisplayNameSwitchChange = (checked: boolean) => {
    setIsDisplayNameEnabled(checked);
  }
  
  const handleThemeColorChange = (newColor: string) => {
    setThemeColor(newColor);
  };

  const handleChatButtonColorChange = (newColor: string) => {
    setChatButtonColor(newColor);
  };

  const handleSaveChanges = () => {
    if (!user || !activeAgent || !isChanged) return;

    startSaving(async () => {
      const dataToUpdate: Partial<Agent> = {};
      if (agentName !== activeAgent.name) {
        dataToUpdate.name = agentName;
      }
      if (isDisplayNameEnabled !== activeAgent.isDisplayNameEnabled) {
        dataToUpdate.isDisplayNameEnabled = isDisplayNameEnabled;
      }
      if (themeColor !== activeAgent.themeColor) {
        dataToUpdate.themeColor = themeColor;
      }
      if (chatButtonColor !== activeAgent.chatButtonColor) {
        dataToUpdate.chatButtonColor = chatButtonColor;
      }
      if (chatBubbleAlignment !== activeAgent.chatBubbleAlignment) {
        dataToUpdate.chatBubbleAlignment = chatBubbleAlignment;
      }
      if (welcomeMessage !== activeAgent.welcomeMessage) {
        dataToUpdate.welcomeMessage = welcomeMessage;
      }
       if (inCallWelcomeMessage !== activeAgent.inCallWelcomeMessage) {
        dataToUpdate.inCallWelcomeMessage = inCallWelcomeMessage;
      }
      if (isWelcomeMessageEnabled !== activeAgent.isWelcomeMessageEnabled) {
        dataToUpdate.isWelcomeMessageEnabled = isWelcomeMessageEnabled;
      }
      if (chatPlaceholder !== activeAgent.chatInputPlaceholder) {
        dataToUpdate.chatInputPlaceholder = chatPlaceholder;
      }
      if (isFeedbackEnabled !== activeAgent.isFeedbackEnabled) {
        dataToUpdate.isFeedbackEnabled = isFeedbackEnabled;
      }
      if (isBargeInEnabled !== activeAgent.isBargeInEnabled) {
        dataToUpdate.isBargeInEnabled = isBargeInEnabled;
      }
      if (isBrandingEnabled !== activeAgent.isBrandingEnabled) {
        dataToUpdate.isBrandingEnabled = isBrandingEnabled;
      }
      if (agentVoice !== activeAgent.agentVoice) {
        dataToUpdate.agentVoice = agentVoice;
      }


      if (Object.keys(dataToUpdate).length > 0 || logoFile) {
        const result = await updateAgent(user.uid, activeAgent.id!, dataToUpdate);
        if ('error' in result) {
          toast({ title: 'Failed to save changes', description: result.error, variant: 'destructive' });
        } else {
          if (Object.keys(dataToUpdate).length > 0) toast({ title: 'Changes saved!' });
          setActiveAgent({ ...activeAgent, ...dataToUpdate });
        }
      }
      // The logo upload is handled inside the LogoUploader component and will show its own toast.
      // We reset the file state regardless.
      setLogoFile(null);
    });
  }

  const handleDiscardChanges = () => {
    if (activeAgent) {
        setAgentName(activeAgent.name);
        setIsDisplayNameEnabled(activeAgent.isDisplayNameEnabled ?? true);
        setThemeColor(activeAgent.themeColor || '#16a34a');
        setChatButtonColor(activeAgent.chatButtonColor || activeAgent.themeColor || '#16a34a');
        setChatBubbleAlignment(activeAgent.chatBubbleAlignment || 'right');
        setWelcomeMessage(activeAgent.welcomeMessage || 'Hello! You are talking to the preview agent. Ask me a question to get started!');
        setInCallWelcomeMessage(activeAgent.inCallWelcomeMessage || 'Hello, how can I help you today?');
        setIsWelcomeMessageEnabled(activeAgent.isWelcomeMessageEnabled ?? true);
        setChatPlaceholder(activeAgent.chatInputPlaceholder || 'Ask anything');
        setIsFeedbackEnabled(activeAgent.isFeedbackEnabled ?? true);
        setIsBargeInEnabled(activeAgent.isBargeInEnabled ?? true);
        setIsBrandingEnabled(activeAgent.isBrandingEnabled ?? true);
        setAgentVoice(activeAgent.agentVoice || 'Zephyr');
        setLogoFile(null);
    }
  }

  const handleOrbColorChange = (colorKey: keyof typeof orbColors, value: string) => {
    setOrbColors(prev => ({...prev, [colorKey]: value}));
  };


  const agentData: Partial<Agent> & { textSources: TextSource[], fileSources: AgentFile[] } = {
    name: agentName,
    logoUrl: activeAgent?.logoUrl, // Pass the current logo url
    isDisplayNameEnabled: isDisplayNameEnabled,
    welcomeMessage: welcomeMessage,
    inCallWelcomeMessage: inCallWelcomeMessage,
    isWelcomeMessageEnabled: isWelcomeMessageEnabled,
    conversationStarters: activeAgent?.conversationStarters,
    themeColor: themeColor,
    chatButtonColor: chatButtonColor,
    chatBubbleAlignment: chatBubbleAlignment,
    chatInputPlaceholder: chatPlaceholder,
    isFeedbackEnabled: isFeedbackEnabled,
    isBargeInEnabled: isBargeInEnabled,
    isBrandingEnabled: isBrandingEnabled,
    instructions: activeAgent?.instructions,
    temperature: activeAgent?.temperature,
    agentVoice: agentVoice,
    textSources: textSources || [],
    fileSources: fileSources || [],
    orbColors,
  };

   const handleToggleCall = () => {
    if (activeAgent) {
      toggleCall(agentData as Agent);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col">
       <TooltipProvider>
       <Tabs defaultValue="chat" className="flex flex-col flex-1 h-full">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Configuration Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
                <div className="px-6 py-3 border-b">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="in-call">In call</TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="chat">
                      <div className="p-6 space-y-6">
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <Label htmlFor="display-name-toggle">Display name</Label>
                               <Switch 
                                id="display-name-toggle" 
                                checked={isDisplayNameEnabled}
                                onCheckedChange={handleDisplayNameSwitchChange}
                              />
                           </div>
                           <Input id="display-name" value={agentName} onChange={handleNameChange} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="logo-toggle">Logo</Label>
                                <Switch id="logo-toggle" defaultChecked/>
                            </div>
                            <LogoUploader agent={activeAgent} onLogoChange={setLogoFile} isSaving={isSaving} />
                        </div>

                        <Separator />
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="welcome-message">
                              Welcome Message
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
                        
                        <div className="space-y-2">
                           <Label htmlFor="placeholder">Chat Input Placeholder</Label>
                           <Input 
                            id="placeholder" 
                            value={chatPlaceholder}
                            onChange={(e) => setChatPlaceholder(e.target.value)}
                           />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Accent</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full p-0 border"
                                  style={{ backgroundColor: themeColor }}
                                />
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                  <ColorPicker
                                      value={themeColor}
                                      onChange={handleThemeColorChange}
                                  />
                              </PopoverContent>
                            </Popover>
                          </div>
                           <div className="flex items-center justify-between">
                            <Label>Chat Bubble Button</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full p-0 border"
                                  style={{ backgroundColor: chatButtonColor }}
                                />
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                  <ColorPicker
                                      value={chatButtonColor}
                                      onChange={handleChatButtonColorChange}
                                  />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <Separator />
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                               <Label>Align chat bubble button</Label>
                               <RadioGroup 
                                    defaultValue="right"
                                    value={chatBubbleAlignment}
                                    onValueChange={(value: 'left' | 'right') => setChatBubbleAlignment(value)}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="left" id="align-left" />
                                        <Label htmlFor="align-left" className="font-normal">Left align</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="right" id="align-right" />
                                        <Label htmlFor="align-right" className="font-normal">Right align</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <Label htmlFor="feedback-toggle" className="font-medium flex items-center gap-2">
                                Collect user feedback
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Collect user feedback by displaying a thumbs up or down button on agent messages.</p>
                                    </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Switch 
                                id="feedback-toggle" 
                                checked={isFeedbackEnabled}
                                onCheckedChange={setIsFeedbackEnabled}
                              />
                            </div>
                             <div className="flex items-center justify-between">
                              <Label htmlFor="branding-toggle" className="font-medium flex items-center gap-2">
                                Remove AgentVerse branding
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Remove the "Powered by AgentVerse" branding from the chat widget.</p>
                                    </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Switch 
                                id="branding-toggle" 
                                checked={!isBrandingEnabled}
                                onCheckedChange={(checked) => setIsBrandingEnabled(!checked)}
                              />
                            </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="in-call">
                       <div className="p-6 space-y-6">
                          <div className="space-y-6">
                            <div>
                               <h3 className="text-lg font-semibold">Voice Configuration</h3>
                               <p className="text-sm text-muted-foreground">
                                 Customize the agent's voice and how it behaves during calls.
                               </p>
                            </div>
                            <div className="space-y-6 pl-2">
                              <div className="space-y-2">
                                <Label htmlFor="agent-voice">Agent Voice</Label>
                                <Select value={agentVoice} onValueChange={(value) => setAgentVoice(value)}>
                                  <SelectTrigger id="agent-voice">
                                    <SelectValue placeholder="Select a voice" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Zephyr">Zephyr</SelectItem>
                                    <SelectItem value="Puck">Puck</SelectItem>
                                    <SelectItem value="Charon">Charon</SelectItem>
                                    <SelectItem value="Kore">Kore</SelectItem>
                                    <SelectItem value="Fenrir">Fenrir</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="welcome-message-in-call">Welcome Message</Label>
                                <Input 
                                  id="welcome-message-in-call" 
                                  placeholder="e.g., Hello, how can I help you today?" 
                                  value={inCallWelcomeMessage}
                                  onChange={(e) => setInCallWelcomeMessage(e.target.value)}
                                />
                              </div>
                               <div className="flex items-center justify-between">
                                <Label htmlFor="barge-in-toggle" className="font-medium flex items-center gap-2">
                                    Enable Interruptions (Barge-in)
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Allow users to interrupt the agent while it's speaking.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Switch 
                                    id="barge-in-toggle" 
                                    checked={isBargeInEnabled}
                                    onCheckedChange={setIsBargeInEnabled}
                                />
                                </div>
                             </div>
                          </div>
                         
                         <Card>
                            <CardHeader>
                                <CardTitle>Orb Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="color-bg">Background</Label>
                                    <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: orbColors.bg }} />
                                        <Input id="color-bg" value={orbColors.bg} onChange={(e) => handleOrbColorChange('bg', e.target.value)} className="w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="color-c1">Gradient Color 1</Label>
                                     <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: orbColors.c1 }} />
                                        <Input id="color-c1" value={orbColors.c1} onChange={(e) => handleOrbColorChange('c1', e.target.value)} className="w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="color-c2">Gradient Color 2</Label>
                                     <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: orbColors.c2 }} />
                                        <Input id="color-c2" value={orbColors.c2} onChange={(e) => handleOrbColorChange('c2', e.target.value)} className="w-48" />
                                    </div>
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label htmlFor="color-c3">Gradient Color 3</Label>
                                     <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: orbColors.c3 }} />
                                        <Input id="color-c3" value={orbColors.c3} onChange={(e) => handleOrbColorChange('c3', e.target.value)} className="w-48" />
                                    </div>
                                </div>
                            </CardContent>
                         </Card>
                       </div>
                    </TabsContent>
                </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-background">
                  <Button variant="ghost" onClick={handleDiscardChanges} disabled={!isChanged || isSaving}>Discard changes</Button>
                  <Button onClick={handleSaveChanges} disabled={!isChanged || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col">
              <TabsContent value="chat" className="flex-1 mt-0">
                <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <ChatWidgetPreview agentData={agentData} mode="chat" />
                </div>
              </TabsContent>
              <TabsContent value="in-call" className="flex-1 mt-0">
                 <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <ChatWidgetPreview agentData={{...agentData, orbColors}} mode="in-call" />
                 </div>
              </TabsContent>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Tabs>
      </TooltipProvider>
    </div>
  );
}
