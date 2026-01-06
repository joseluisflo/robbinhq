'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/custom/color-picker';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { VoiceSelector } from './VoiceSelector';

interface OrbColors {
    bg: string;
    c1: string;
    c2: string;
    c3: string;
}

interface InCallDesignSettingsProps {
    agentVoice: string;
    setAgentVoice: (value: string) => void;
    inCallWelcomeMessage: string;
    setInCallWelcomeMessage: (value: string) => void;
    isBargeInEnabled: boolean;
    setIsBargeInEnabled: (checked: boolean) => void;
    orbColors: OrbColors;
    handleOrbColorChange: (colorKey: keyof OrbColors, value: string) => void;
}

export function InCallDesignSettings({
    agentVoice,
    setAgentVoice,
    inCallWelcomeMessage,
    setInCallWelcomeMessage,
    isBargeInEnabled,
    setIsBargeInEnabled,
    orbColors,
    handleOrbColorChange,
}: InCallDesignSettingsProps) {
    return (
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
                        <VoiceSelector
                          selectedValue={agentVoice}
                          onValueChange={setAgentVoice}
                        />
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

            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">Orb Colors</h3>
                </div>
                <div className="space-y-4 pl-2">
                    <div className="flex items-center justify-between">
                        <Label>Background</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 border" style={{ backgroundColor: orbColors.bg }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <ColorPicker value={orbColors.bg} onChange={(color) => handleOrbColorChange('bg', color)} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Gradient Color 1</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 border" style={{ backgroundColor: orbColors.c1 }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <ColorPicker value={orbColors.c1} onChange={(color) => handleOrbColorChange('c1', color)} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Gradient Color 2</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 border" style={{ backgroundColor: orbColors.c2 }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <ColorPicker value={orbColors.c2} onChange={(color) => handleOrbColorChange('c2', color)} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Gradient Color 3</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 border" style={{ backgroundColor: orbColors.c3 }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <ColorPicker value={orbColors.c3} onChange={(color) => handleOrbColorChange('c3', color)} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
}
