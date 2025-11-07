'use client';

import { useState } from 'react';
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

export default function DesignPage() {
  const [agentName, setAgentName] = useState('Fitness Assistant');

  return (
    <div className="h-full flex-1 flex flex-col">
       <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Configuration Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Display</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="display-name-toggle">Display name</Label>
                                <Input id="display-name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-2"/>
                            </div>
                            <Switch id="display-name-toggle" defaultChecked />
                        </div>

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
            <Tabs defaultValue="chat" className="flex flex-col flex-1 h-full">
              <div className="px-6 py-3 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="in-call">In call</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="chat" className="flex-1 mt-0">
                <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <ChatWidgetPreview agentName={agentName} />
                </div>
              </TabsContent>
              <TabsContent value="in-call" className="flex-1 mt-0">
                 <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <div className="flex flex-col h-full w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden items-center justify-center">
                        <p className="text-muted-foreground text-sm mb-4">This is a preview of the in-call state.</p>
                        <div className="w-40 h-40 bg-blue-500/10 rounded-full flex items-center justify-center">
                           <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <div className="w-24 h-24 bg-blue-500/30 rounded-full"/>
                           </div>
                        </div>
                        <Button variant="destructive" className="mt-8">Close</Button>
                    </div>
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
