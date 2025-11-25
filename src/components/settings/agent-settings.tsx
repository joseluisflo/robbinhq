"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActiveAgent } from "@/app/(main)/layout";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateAgent } from "@/app/actions/agents";
import { Loader2, Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AgentSettings() {
    const { activeAgent, setActiveAgent } = useActiveAgent();
    const { user } = useUser();
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    
    const [isSaving, startSaving] = useTransition();

    const isChanged =
        name !== (activeAgent?.name || "") ||
        description !== (activeAgent?.description || "");

    useEffect(() => {
        if (activeAgent) {
            setName(activeAgent.name || "");
            setDescription(activeAgent.description || "");
        }
    }, [activeAgent]);

    const handleCopyId = () => {
        if (!activeAgent?.id) return;
        navigator.clipboard.writeText(activeAgent.id);
        toast({ title: "Copied to clipboard!", description: "Agent ID has been copied." });
    };

    const handleSaveChanges = () => {
        if (!user || !activeAgent || !isChanged) return;

        startSaving(async () => {
            const dataToUpdate: Partial<{ name: string; description: string }> = {};
            if (name !== activeAgent.name) {
                dataToUpdate.name = name;
            }
            if (description !== activeAgent.description) {
                dataToUpdate.description = description;
            }

            const result = await updateAgent(user.uid, activeAgent.id!, dataToUpdate);

            if (result.error) {
                toast({ title: "Error updating agent", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Agent details have been updated." });
                if (setActiveAgent) {
                    setActiveAgent({ ...activeAgent, ...dataToUpdate });
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="agent-name">Name</Label>
                    <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="agent-description">Description</Label>
                    <Textarea
                        id="agent-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="agent-id">Agent ID</Label>
                    <div className="flex items-center gap-2">
                        <Input id="agent-id" value={activeAgent?.id || ""} readOnly />
                        <Button variant="outline" size="icon" onClick={handleCopyId}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">This unique ID is used for API calls and integrations.</p>
                </div>
            </div>
            
            <Separator />

            <div className="p-4 rounded-lg border border-destructive/50 space-y-4">
                <div>
                    <h4 className="text-lg font-semibold text-destructive">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground">
                        These actions are irreversible. Please be certain before proceeding.
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Delete this agent</p>
                        <p className="text-sm text-muted-foreground">Once deleted, all of its data will be gone forever.</p>
                    </div>
                    <Button variant="destructive">Delete Agent</Button>
                </div>
            </div>


            <div className="border-t pt-4">
              <Button onClick={handleSaveChanges} disabled={!isChanged || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
        </div>
    );
}
