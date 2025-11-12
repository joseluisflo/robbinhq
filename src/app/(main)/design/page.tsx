
'use client';

import { useState, useEffect, useTransition } from 'react';
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
import type { Agent } from '@/lib/types';
import { LogoUploader } from '@/components/logo-uploader';
import { Info, Loader2 } from 'lucide-react';
import { updateAgent } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { ColorPicker } from '@/components/custom/color-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default function DesignPage() {
  const { activeAgent, setActiveAgent } = useActiveAgent();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [agentName, setAgentName] = useState('');
  const [isDisplayNameEnabled, setIsDisplayNameEnabled] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [themeColor, setThemeColor] = useState('#16a34a');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isWelcomeMessageEnabled, setIsWelcomeMessageEnabled] = useState(true);
  const [chatPlaceholder, setChatPlaceholder] = useState('');


  const [isSaving, startSaving] = useTransition();

  const isChanged = 
    agentName !== (activeAgent?.name || '') ||
    isDisplayNameEnabled !== (activeAgent?.isDisplayNameEnabled ?? true) ||
    logoFile !== null ||
    themeColor !== (activeAgent?.themeColor || '#16a34a') ||
    welcomeMessage !== (activeAgent?.welcomeMessage || '') ||
    isWelcomeMessageEnabled !== (activeAgent?.isWelcomeMessageEnabled ?? true) ||
    chatPlaceholder !== (activeAgent?.chatInputPlaceholder || '');


  useEffect(() => {
    if (activeAgent) {
      setAgentName(activeAgent.name);
      setIsDisplayNameEnabled(activeAgent.isDisplayNameEnabled ?? true);
      setThemeColor(activeAgent.themeColor || '#16a34a');
      setWelcomeMessage(activeAgent.welcomeMessage || 'Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!');
      setIsWelcomeMessageEnabled(activeAgent.isWelcomeMessageEnabled ?? true);
      setChatPlaceholder(activeAgent.chatInputPlaceholder || 'Ask anything');
      setLogoFile(null); // Reset file on agent change
    } else {
      setAgentName('');
      setIsDisplayNameEnabled(true);
      setThemeColor('#16a34a');
      setWelcomeMessage('Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!');
      setIsWelcomeMessageEnabled(true);
      setChatPlaceholder('Ask anything');
    }
  }, [activeAgent]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setAgentName(newName);
  };

  const handleDisplayNameSwitchChange = (checked: boolean) => {
    setIsDisplayNameEnabled(checked);
  }

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
      if (welcomeMessage !== activeAgent.welcomeMessage) {
        dataToUpdate.welcomeMessage = welcomeMessage;
      }
      if (isWelcomeMessageEnabled !== activeAgent.isWelcomeMessageEnabled) {
        dataToUpdate.isWelcomeMessageEnabled = isWelcomeMessageEnabled;
      }
      if (chatPlaceholder !== activeAgent.chatInputPlaceholder) {
        dataToUpdate.chatInputPlaceholder = chatPlaceholder;
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
        setWelcomeMessage(activeAgent.welcomeMessage || 'Hola, estás hablando con el agente de vista previa. ¡Hazme una pregunta para empezar!');
        setIsWelcomeMessageEnabled(activeAgent.isWelcomeMessageEnabled ?? true);
        setChatPlaceholder(activeAgent.chatInputPlaceholder || 'Ask anything');
        setLogoFile(null);
    }
  }


  const agentData: Partial<Agent> = {
    name: agentName,
    logoUrl: activeAgent?.logoUrl, // Pass the current logo url
    isDisplayNameEnabled: isDisplayNameEnabled,
    welcomeMessage: welcomeMessage,
    isWelcomeMessageEnabled: isWelcomeMessageEnabled,
    conversationStarters: activeAgent?.conversationStarters,
    themeColor: themeColor,
    chatInputPlaceholder: chatPlaceholder,
  };

  return (
    <div className="h-full flex-1 flex flex-col">
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
                      <div className="p-6 space-y-8">
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
                                      onChange={(newColor: string) => {
                                        setThemeColor(newColor);
                                      }}
                                  />
                              </PopoverContent>
                            </Popover>
                          </div>
                           <Separator />
                        </div>

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
                      </div>
                    </TabsContent>
                    <TabsContent value="in-call">
                       <div className="p-6 space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Voice Configuration</CardTitle>
                              <CardDescription>
                                Customize the agent's voice and how it behaves during calls.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="agent-voice">Agent Voice</Label>
                                <Select defaultValue="alloy">
                                  <SelectTrigger id="agent-voice">
                                    <SelectValue placeholder="Select a voice" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="alloy">Alloy (Male)</SelectItem>
                                    <SelectItem value="echo">Echo (Male)</SelectItem>
                                    <SelectItem value="fable">Fable (Male)</SelectItem>
                                    <SelectItem value="onyx">Onyx (Male)</SelectItem>
                                    <SelectItem value="nova">Nova (Female)</SelectItem>
                                    <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="welcome-message">Welcome Message</Label>
                                <Input id="welcome-message" placeholder="e.g., Hello, how can I help you today?" />
                              </div>
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label htmlFor="barge-in-toggle" className="font-medium">Enable Interruptions (Barge-in)</Label>
                                    <p className="text-sm text-muted-foreground">Allow callers to interrupt the agent while it's speaking.</p>
                                </div>
                                <Switch id="barge-in-toggle" defaultChecked />
                              </div>
                            </CardContent>
                          </Card>
                         <Card>
                           <CardHeader>
                             <CardTitle>Orb Customization</CardTitle>
                             <CardDescription>Customize the appearance and animation of the in-call orb.</CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="orb-size">Orb Size</Label>
                                <Input id="orb-size" placeholder="e.g., 192px" defaultValue="160px" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="orb-animation">Animation Duration (seconds)</Label>
                                <Slider id="orb-animation" defaultValue={[20]} max={60} step={1} />
                              </div>
                           </CardContent>
                         </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Orb Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="color-bg">Background</Label>
                                    <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: 'oklch(95% 0.02 264.695)' }} />
                                        <Input id="color-bg" defaultValue="oklch(95% 0.02 264.695)" className="w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="color-c1">Gradient Color 1</Label>
                                     <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: 'oklch(75% 0.15 350)' }} />
                                        <Input id="color-c1" defaultValue="oklch(75% 0.15 350)" className="w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="color-c2">Gradient Color 2</Label>
                                     <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: 'oklch(80% 0.12 200)' }} />
                                        <Input id="color-c2" defaultValue="oklch(80% 0.12 200)" className="w-48" />
                                    </div>
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label htmlFor="color-c3">Gradient Color 3</Label>
                                     <div className='flex items-center gap-2'>
                                        <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: 'oklch(78% 0.14 280)' }} />
                                        <Input id="color-c3" defaultValue="oklch(78% 0.14 280)" className="w-48" />
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
                    <ChatWidgetPreview agentData={agentData} mode="in-call" />
                 </div>
              </TabsContent>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Tabs>
    </div>
  );
}

    

    
