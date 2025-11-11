
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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


export default function DesignPage() {
  const { activeAgent, setActiveAgent } = useActiveAgent();
  
  const [agentName, setAgentName] = useState('Agent Name');
  const [isDisplayNameEnabled, setIsDisplayNameEnabled] = useState(true);

  useEffect(() => {
    if (activeAgent) {
      setAgentName(activeAgent.name);
      // A default for isDisplayNameEnabled should be handled if not present
      setIsDisplayNameEnabled(activeAgent.isDisplayNameEnabled ?? true);
    }
  }, [activeAgent]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setAgentName(newName);
    if (activeAgent) {
      setActiveAgent({ ...activeAgent, name: newName });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setIsDisplayNameEnabled(checked);
    if (activeAgent) {
      setActiveAgent({ ...activeAgent, isDisplayNameEnabled: checked });
    }
  }

  const agentData: Partial<Agent> & { isDisplayNameEnabled?: boolean } = {
    name: agentName,
    isDisplayNameEnabled: isDisplayNameEnabled,
    welcomeMessage: activeAgent?.welcomeMessage,
    isWelcomeMessageEnabled: activeAgent?.isWelcomeMessageEnabled,
    conversationStarters: activeAgent?.conversationStarters,
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
                                onCheckedChange={handleSwitchChange}
                              />
                           </div>
                           <Input id="display-name" value={agentName} onChange={handleNameChange} />
                        </div>
                        <Card>
                          <CardHeader>
                              <CardTitle>Display</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                   <div>
                                      <Label htmlFor="logo-toggle">Logo</Label>
                                      <div className="w-full h-24 mt-2 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                                          Logo upload area
                                      </div>
                                  </div>
                                  <Switch id="logo-toggle" />
                              </div>
                               <div className="rounded-lg border p-4">
                                  <Label htmlFor="favicon">Favicon</Label>
                                  <div className="w-16 h-16 mt-2 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                      32x32
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Theme</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Background</Label>
                                    <div className="h-8 w-8 rounded-full border bg-background" />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label>Accent</Label>
                                    <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: '#16a34a' }}/>
                                </div>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader>
                                <CardTitle>Initial Message</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="heading-toggle">Heading</Label>
                                        <Input id="heading" defaultValue="How can I help?" className="mt-2"/>
                                    </div>
                                    <Switch id="heading-toggle" defaultChecked/>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                     <div>
                                        <Label htmlFor="description-toggle">Description</Label>
                                        <Textarea id="description" defaultValue="Start by asking a question or customizing how your agent responds." className="mt-2"/>
                                    </div>
                                    <Switch id="description-toggle" defaultChecked/>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Chat Input</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                     <Label htmlFor="placeholder">Placeholder</Label>
                                     <Input id="placeholder" defaultValue="Ask anything" />
                                </div>
                            </CardContent>
                        </Card>
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
                  <Button variant="ghost">Discard changes</Button>
                  <Button>Save changes</Button>
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
