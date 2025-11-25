"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function AccountSettings() {
    return (
        <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold">Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                This is how your name and email will be displayed.
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Jose Luis Flores" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="jlfloressanchez01@gmail.com" readOnly />
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
                <Input id="current-password" type="password" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button>Save</Button>
            </div>
        </div>
    );
}
