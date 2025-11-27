

'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveAgent } from '../layout';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { updateAgent } from '@/app/actions/agents';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLiveAgent } from '@/hooks/use-live-agent';
import { ChatDesignSettings } from '@/components/design/ChatDesignSettings';
import { InCallDesignSettings } from '@/components/design/InCallDesignSettings';


export default function DesignPage() {
  const { activeAgent, setActiveAgent, userProfile } = useActiveAgent();
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
    bg: '#F5F3F9',
    c1: '#F4ABC4',
    c2: '#A4DDEE',
    c3: '#D6B9ED',
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
    agentVoice !== (activeAgent?.agentVoice || 'Zephyr') ||
    JSON.stringify(orbColors) !== JSON.stringify(activeAgent?.orbColors || {
        bg: '#F5F3F9',
        c1: '#F4ABC4',
        c2: '#A4DDEE',
        c3: '#D6B9ED',
    });


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
      setOrbColors(activeAgent.orbColors || {
        bg: '#F5F3F9',
        c1: '#F4ABC4',
        c2: '#A4DDEE',
        c3: '#D6B9ED',
      });
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
  
  const handleOrbColorChange = (colorKey: keyof typeof orbColors, value: string) => {
    setOrbColors(prev => ({...prev, [colorKey]: value}));
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
       if (JSON.stringify(orbColors) !== JSON.stringify(activeAgent.orbColors)) {
        dataToUpdate.orbColors = orbColors;
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
        setOrbColors(activeAgent.orbColors || {
            bg: '#F5F3F9',
            c1: '#F4ABC4',
            c2: '#A4DDEE',
            c3: '#D6B9ED',
        });
        setLogoFile(null);
    }
  }


  const agentForPreview = useMemo(() => {
    const data: Partial<Agent> & { textSources: TextSource[], fileSources: AgentFile[] } = {
        // We pass the activeAgent which contains the ID
        ...activeAgent,
        // Then override with the current state from the form fields
        name: agentName,
        isDisplayNameEnabled: isDisplayNameEnabled,
        logoUrl: logoFile ? URL.createObjectURL(logoFile) : activeAgent?.logoUrl,
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
        orbColors,
        // Pass the loaded sources for context
        textSources: textSources || [],
        fileSources: fileSources || [],
    };
    return data as Agent;
  }, [
      activeAgent, agentName, isDisplayNameEnabled, logoFile, welcomeMessage, 
      inCallWelcomeMessage, isWelcomeMessageEnabled, themeColor, chatButtonColor, 
      chatBubbleAlignment, chatPlaceholder, isFeedbackEnabled, isBargeInEnabled, 
      isBrandingEnabled, agentVoice, orbColors, textSources, fileSources
  ]);


   const handleToggleCall = () => {
    if (activeAgent) {
      toggleCall(agentForPreview);
    }
  };
  
  const isFreePlan = userProfile?.planId === 'free';

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
                    <TabsContent value="chat" className="mt-0 data-[state=inactive]:hidden">
                        <ChatDesignSettings
                            agentName={agentName}
                            handleNameChange={handleNameChange}
                            isDisplayNameEnabled={isDisplayNameEnabled}
                            handleDisplayNameSwitchChange={handleDisplayNameSwitchChange}
                            activeAgent={activeAgent}
                            onLogoChange={setLogoFile}
                            isSaving={isSaving}
                            isWelcomeMessageEnabled={isWelcomeMessageEnabled}
                            setIsWelcomeMessageEnabled={setIsWelcomeMessageEnabled}
                            welcomeMessage={welcomeMessage}
                            setWelcomeMessage={setWelcomeMessage}
                            chatPlaceholder={chatPlaceholder}
                            setChatPlaceholder={setChatPlaceholder}
                            themeColor={themeColor}
                            setThemeColor={setThemeColor}
                            chatButtonColor={chatButtonColor}
                            setChatButtonColor={setChatButtonColor}
                            chatBubbleAlignment={chatBubbleAlignment}
                            setChatBubbleAlignment={setChatBubbleAlignment}
                            isFeedbackEnabled={isFeedbackEnabled}
                            setIsFeedbackEnabled={setIsFeedbackEnabled}
                            isBrandingEnabled={isBrandingEnabled}
                            setIsBrandingEnabled={setIsBrandingEnabled}
                            isFreePlan={isFreePlan}
                        />
                    </TabsContent>
                    <TabsContent value="in-call" className="mt-0 data-[state=inactive]:hidden">
                       <InCallDesignSettings
                            agentVoice={agentVoice}
                            setAgentVoice={setAgentVoice}
                            inCallWelcomeMessage={inCallWelcomeMessage}
                            setInCallWelcomeMessage={setInCallWelcomeMessage}
                            isBargeInEnabled={isBargeInEnabled}
                            setIsBargeInEnabled={setIsBargeInEnabled}
                            orbColors={orbColors}
                            handleOrbColorChange={handleOrbColorChange}
                       />
                    </TabsContent>
                </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-background">
                  <Button variant="ghost" onClick={handleDiscardChanges} disabled={!isChanged || isSaving}>Discard changes</Button>
                  <Button className="flex-1 max-w-xs" onClick={handleSaveChanges} disabled={!isChanged || isSaving}>
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
              <TabsContent value="chat" className="flex-1 mt-0 data-[state=inactive]:hidden">
                <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <ChatWidgetPreview agent={agentForPreview} mode="chat" />
                </div>
              </TabsContent>
              <TabsContent value="in-call" className="flex-1 mt-0 data-[state=inactive]:hidden">
                 <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <ChatWidgetPreview agent={{...agentForPreview, orbColors}} mode="in-call" />
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
