
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Mail, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DeployEmailPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy to Email</h2>
        <Button>Save changes</Button>
      </div>

      {/* Connection Section */}
      <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold">Email Account Connection</h3>
            <p className="text-sm text-muted-foreground">
                Connect a Google or Microsoft account to allow the agent to read and send emails.
            </p>
        </div>
        <div className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="font-semibold">Not Connected</p>
                    <p className="text-sm text-muted-foreground">Connect an email account to get started.</p>
                </div>
                </div>
                <Button variant="outline">Connect</Button>
            </div>
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                The agent will only read and reply to new, unread emails in the inbox. It will not have access to your historical emails.
                </AlertDescription>
            </Alert>
        </div>
      </div>

      {/* Behavior Section */}
      <div className="space-y-4">
         <div>
            <h3 className="text-lg font-semibold">Behavior</h3>
            <p className="text-sm text-muted-foreground">
                Customize how your agent interacts with incoming emails.
            </p>
        </div>
        <div className="space-y-6 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="auto-reply-toggle" className="font-medium">Enable Auto-Reply</Label>
                <p className="text-sm text-muted-foreground">Allow the agent to automatically reply to emails.</p>
            </div>
            <Switch id="auto-reply-toggle" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="signature">Email Signature</Label>
            <Textarea
              id="signature"
              placeholder="e.g., Best, Your Friendly AI Assistant"
              rows={3}
            />
             <p className="text-sm text-muted-foreground">This signature will be appended to all emails sent by the agent.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="handoff-email">Human Handoff Email</Label>
            <Input id="handoff-email" placeholder="support@example.com" />
            <p className="text-sm text-muted-foreground">
              If the agent cannot answer, it will forward the email to this address.
            </p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Security</h3>
           <p className="text-sm text-muted-foreground">
            Only process emails from specific domains to prevent spam.
          </p>
        </div>
         <div className="rounded-lg border p-6">
          <Label htmlFor="allowed-domains">Allowed Domains</Label>
          <Textarea
            id="allowed-domains"
            className="mt-2"
            placeholder="example.com"
            defaultValue={'*.example.com'}
            rows={4}
          />
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
            <Info className="h-3 w-3" />
            Enter each domain in a new line. Use * as a wildcard.
          </p>
        </div>
      </div>

      {/* Delete Zone */}
      <div className="space-y-4 rounded-lg border border-destructive p-6">
         <div>
          <h3 className="text-lg font-semibold text-destructive">Disconnect Email</h3>
           <p className="text-sm text-muted-foreground">
            Disconnecting the email will stop the agent from processing new emails. This action cannot be undone.
          </p>
        </div>
        <div>
            <Button variant="destructive">Disconnect</Button>
        </div>
      </div>

    </div>
  );
}
