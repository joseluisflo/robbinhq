
"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { updateUserProfile } from "@/app/actions/users";
import { Loader2 } from "lucide-react";

export function AccountSettings() {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [isSaving, startSaving] = useTransition();

    const isNameChanged = name !== (user?.displayName || "");
    // For now, only checking name change. Password logic will be separate.
    const isChanged = isNameChanged;

    useEffect(() => {
        if (user) {
            setName(user.displayName || "");
        }
    }, [user]);

    const handleSaveChanges = () => {
        if (!user || !isChanged) return;

        startSaving(async () => {
            if (isNameChanged) {
                // Update Firebase Auth profile on the client
                if (auth?.currentUser) {
                    try {
                        await updateProfile(auth.currentUser, { displayName: name });
                        
                        // Update Firestore profile on the server
                        const result = await updateUserProfile(user.uid, { displayName: name });

                        if (result.error) {
                            throw new Error(result.error);
                        }
                        
                        toast({ title: "Success", description: "Your profile has been updated." });
                        
                        // Manually trigger a re-render or state update if needed, though useUser should reflect this
                        // Forcing a refresh might be too heavy, but is an option: router.refresh();

                    } catch (error: any) {
                         toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
                    }
                }
            }
            // Password change logic will go here in the next step
        });
    }


    return (
        <div className="space-y-8">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} readOnly />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-2xl font-semibold">Password</h3>
              <p className="text-sm text-muted-foreground">
                Manage your password for added security.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button onClick={handleSaveChanges} disabled={!isChanged || isSaving} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
        </div>
    );
}
