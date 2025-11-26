
'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { LogoUploader } from '@/components/logo-uploader';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/custom/color-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { Agent } from '@/lib/types';

interface ChatDesignSettingsProps {
    agentName: string;
    handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDisplayNameEnabled: boolean;
    handleDisplayNameSwitchChange: (checked: boolean) => void;
    activeAgent: Agent | null;
    onLogoChange: (file: File | null) => void;
    isSaving: boolean;
    isWelcomeMessageEnabled: boolean;
    setIsWelcomeMessageEnabled: (checked: boolean) => void;
    welcomeMessage: string;
    setWelcomeMessage: (value: string) => void;
    chatPlaceholder: string;
    setChatPlaceholder: (value: string) => void;
    themeColor: string;
    setThemeColor: (value: string) => void;
    chatButtonColor: string;
    setChatButtonColor: (value: string) => void;
    chatBubbleAlignment: 'left' | 'right';
    setChatBubbleAlignment: (value: 'left' | 'right') => void;
    isFeedbackEnabled: boolean;
    setIsFeedbackEnabled: (checked: boolean) => void;
    isBrandingEnabled: boolean;
    setIsBrandingEnabled: (checked: boolean) => void;
}

export function ChatDesignSettings({
    agentName,
    handleNameChange,
    isDisplayNameEnabled,
    handleDisplayNameSwitchChange,
    activeAgent,
    onLogoChange,
    isSaving,
    isWelcomeMessageEnabled,
    setIsWelcomeMessageEnabled,
    welcomeMessage,
    setWelcomeMessage,
    chatPlaceholder,
    setChatPlaceholder,
    themeColor,
    setThemeColor,
    chatButtonColor,
    setChatButtonColor,
    chatBubbleAlignment,
    setChatBubbleAlignment,
    isFeedbackEnabled,
    setIsFeedbackEnabled,
    isBrandingEnabled,
    setIsBrandingEnabled
}: ChatDesignSettingsProps) {
    return (
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
                    <Switch id="logo-toggle" defaultChecked />
                </div>
                <LogoUploader agent={activeAgent} onLogoChange={onLogoChange} isSaving={isSaving} />
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
                                onChange={(newColor) => setThemeColor(newColor)}
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
                                onChange={(newColor) => setChatButtonColor(newColor)}
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
    );
}
