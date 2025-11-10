
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

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Email Account Connection</CardTitle>
          <CardDescription>
            Connect a Google or Microsoft account to allow the agent to read and send emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
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
        </CardContent>
      </Card>

      {/* Behavior Card */}
      <Card>
        <CardHeader>
          <CardTitle>Behavior</CardTitle>
          <CardDescription>
            Customize how your agent interacts with incoming emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
                <Label htmlFor="auto-reply-toggle" className="font-medium">Enable Auto-Reply</Label>
                <p className="text-sm text-muted-foreground">Allow the agent to automatically reply to emails.</p>
            </div>
            <Switch id="auto-reply-toggle" defaultChecked />
          </div>
           <div className="space-y-2">
            <Label htmlFor="signature">Email Signature</Label>
            <Textarea
              id="signature"
              placeholder="e.g., Best,&#10;Your Friendly AI Assistant"
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
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
           <CardDescription>
            Only process emails from specific domains to prevent spam.
          </CardDescription>
        </CardHeader>
         <CardContent>
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
        </CardContent>
      </Card>

      {/* Delete Zone */}
      <Card className="border-destructive">
         <CardHeader>
          <CardTitle className="text-destructive">Disconnect Email</CardTitle>
           <CardDescription>
            Disconnecting the email will stop the agent from processing new emails. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter>
            <Button variant="destructive">Disconnect</Button>
        </CardFooter>
      </Card>

    </div>
  );
}
