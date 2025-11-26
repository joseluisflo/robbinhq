

"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useActiveAgent } from "@/app/(main)/layout";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateAgent } from "@/app/actions/agents";
import type { Agent } from "@/lib/types";


export function PrivacySettings() {
    const { activeAgent, setActiveAgent } = useActiveAgent();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [retention, setRetention] = useState<'30' | '90' | '365' | 'forever'>("90");
    const [anonymize, setAnonymize] = useState(false);
    const [isSaving, startSaving] = useTransition();

    const isChanged = retention !== (activeAgent?.dataRetentionPolicy || '90') || anonymize !== (activeAgent?.anonymizeData || false);

    useEffect(() => {
        if (activeAgent) {
            setRetention(activeAgent.dataRetentionPolicy || '90');
            setAnonymize(activeAgent.anonymizeData || false);
        }
    }, [activeAgent]);

    const handleSaveChanges = () => {
        if (!user || !activeAgent || !isChanged) return;

        startSaving(async () => {
            const dataToUpdate: Partial<Agent> = {};
            if (retention !== (activeAgent.dataRetentionPolicy || '90')) {
                dataToUpdate.dataRetentionPolicy = retention;
            }
            if (anonymize !== (activeAgent.anonymizeData || false)) {
                dataToUpdate.anonymizeData = anonymize;
            }

            const result = await updateAgent(user.uid, activeAgent.id!, dataToUpdate);

            if ('error' in result) {
                toast({ title: 'Failed to save settings', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Privacy settings saved!' });
                setActiveAgent({ ...activeAgent, ...dataToUpdate });
            }
        });
    };


    const retentionOptions = [
        { value: "30", label: "30 days" },
        { value: "90", label: "90 days" },
        { value: "365", label: "1 year" },
        { value: "forever", label: "Forever" },
    ];
    
    const selectedIndex = retentionOptions.findIndex(o => o.value === retention);

    return (
        <div className="space-y-8">
            <div>
                <h4 className="text-lg font-semibold">Data Management</h4>
                <p className="text-sm text-muted-foreground">Control how visitor data is handled and retained.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="data-retention">Data Retention Policy</Label>
                <div className="w-full">
                     <RadioGroup
                        value={retention}
                        onValueChange={(v) => setRetention(v as '30' | '90' | '365' | 'forever')}
                        className="relative grid grid-cols-4 items-center justify-center rounded-lg bg-muted p-1 text-center font-medium text-sm"
                    >
                         <div
                            className="absolute h-[calc(100%-0.5rem)] rounded-md bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            style={{ 
                                width: `calc((100% - 0.5rem) / 4)`,
                                transform: `translateX(calc(${selectedIndex * 100}% + ${selectedIndex * 0.125}rem))` 
                            }}
                        />
                        {retentionOptions.map((option) => (
                            <Label
                                key={option.value}
                                htmlFor={`retention-${option.value}`}
                                className={cn(
                                    "relative z-10 flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                                    retention === option.value ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {option.label}
                                <RadioGroupItem value={option.value} id={`retention-${option.value}`} className="sr-only" />
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
                <p className="text-sm text-muted-foreground">
                    Conversation logs will be automatically deleted after this period.
                </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="anonymization-toggle">Anonymize Visitor Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Do not store visitor's personal information (IP, location, etc.).
                    </p>
                </div>
                <Switch 
                    id="anonymization-toggle" 
                    checked={anonymize}
                    onCheckedChange={setAnonymize}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Export Agent Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Download a CSV file with all conversations and leads.
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                </Button>
            </div>

            <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                <div>
                    <p className="text-lg font-semibold text-destructive">Danger Zone</p>
                    <p className="text-sm text-muted-foreground">These actions are irreversible. Please proceed with caution.</p>
                </div>

                <div className="space-y-4">
                     <div className="flex items-center justify-between border-t border-dashed border-destructive/30 pt-4">
                        <div>
                            <p className="font-medium">Delete all Chat Logs</p>
                            <p className="text-sm text-muted-foreground">Permanently delete all conversation history for this agent.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Logs
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all chat logs. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                    Confirm Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="flex items-center justify-between border-t border-dashed border-destructive/30 pt-4">
                        <div>
                            <p className="font-medium">Delete all Captured Leads</p>
                            <p className="text-sm text-muted-foreground">Permanently delete all leads captured by this agent.</p>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Leads
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all captured leads. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                    Confirm Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
              <Button onClick={handleSaveChanges} disabled={!isChanged || isSaving} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
        </div>
    );
}
