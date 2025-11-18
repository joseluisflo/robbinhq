
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Info, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useActiveAgent } from '@/app/(main)/layout';
import { useToast } from '@/hooks/use-toast';

export default function DeployEmailPage() {
    const { activeAgent } = useActiveAgent();
    const { toast } = useToast();

    // Placeholder for the unique email address generation
    const uniqueAgentEmail = `agent-${activeAgent?.id || 'loading'}@your-domain.com`;

    const handleCopy = () => {
        navigator.clipboard.writeText(uniqueAgentEmail);
        toast({
            title: 'Copied to clipboard!',
            description: 'You can now set up forwarding in your email client.',
        });
    };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy to Email</h2>
        <Button>Save changes</Button>
      </div>

      {/* Agent Email Address Section */}
      <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold">Agent Email Address</h3>
            <p className="text-sm text-muted-foreground">
                Forward emails from your existing account to this unique address.
            </p>
        </div>
        <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Input id="agent-email" readOnly value={uniqueAgentEmail} />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                To get started, configure your email provider (e.g., Gmail, Outlook) to automatically forward incoming emails to the address above. The agent will then process them and reply to the original sender.
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
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
         <div>
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
    </div>
  );
}
