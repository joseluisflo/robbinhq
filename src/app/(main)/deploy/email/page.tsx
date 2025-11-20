
'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { Mail, Info, Copy, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useActiveAgent } from '@/app/(main)/layout';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { updateAgent } from '@/app/actions/agents';
import { useUser } from '@/firebase';
import type { Agent } from '@/lib/types';


export default function DeployEmailPage() {
    const { activeAgent, setActiveAgent } = useActiveAgent();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, startSaving] = useTransition();

    const [emailSignature, setEmailSignature] = useState('');
    const [handoffEmail, setHandoffEmail] = useState('');
    
    const agentEmailDomain = process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_EMAIL_INGEST_DOMAIN || 'your-domain.com';

    const isChanged = 
        emailSignature !== (activeAgent?.emailSignature || '') ||
        handoffEmail !== (activeAgent?.handoffEmail || '');

    useEffect(() => {
        if (activeAgent) {
            setEmailSignature(activeAgent.emailSignature || '');
            setHandoffEmail(activeAgent.handoffEmail || '');
        }
    }, [activeAgent]);

    const handleSaveChanges = () => {
        if (!user || !activeAgent || !isChanged) return;

        startSaving(async () => {
            const dataToUpdate: Partial<Agent> = {};
            if (emailSignature !== activeAgent.emailSignature) {
                dataToUpdate.emailSignature = emailSignature;
            }
             if (handoffEmail !== activeAgent.handoffEmail) {
                dataToUpdate.handoffEmail = handoffEmail;
            }

            const result = await updateAgent(user.uid, activeAgent.id!, dataToUpdate);

            if ('error' in result) {
                toast({ title: 'Failed to save changes', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Changes saved!' });
                setActiveAgent({ ...activeAgent, ...dataToUpdate });
            }
        });
    }

    const uniqueAgentEmail = useMemo(() => {
        if (!activeAgent?.id) return 'loading...';
        if (agentEmailDomain === 'your-domain.com') return 'Domain not configured.';
        return `agent-${activeAgent.id}@${agentEmailDomain}`;
    }, [activeAgent?.id, agentEmailDomain]);

    const handleCopy = () => {
        if (uniqueAgentEmail.includes('@')) {
            navigator.clipboard.writeText(uniqueAgentEmail);
            toast({
                title: 'Copied to clipboard!',
                description: 'You can now test by sending an email to this address.',
            });
        }
    };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy to Email</h2>
        <Button onClick={handleSaveChanges} disabled={isSaving || !isChanged}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>

      {/* Agent Email Address Section */}
      <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold">Agent Email Address</h3>
            <p className="text-sm text-muted-foreground">
                Emails sent to this unique address will be processed by your agent.
            </p>
        </div>
        <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Input id="agent-email" readOnly value={uniqueAgentEmail} />
                <Button variant="outline" size="icon" onClick={handleCopy} disabled={!uniqueAgentEmail.includes('@')}>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                This address is handled by your domain&apos;s email routing rules (e.g., Cloudflare Email Routing). When an email is sent here, it&apos;s forwarded to a worker which securely calls your agent&apos;s API endpoint. The agent then processes it and replies to the original sender.
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
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
            />
             <p className="text-sm text-muted-foreground">This signature will be appended to all emails sent by the agent.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="handoff-email">Human Handoff Email</Label>
            <Input 
                id="handoff-email" 
                placeholder="support@example.com" 
                value={handoffEmail}
                onChange={(e) => setHandoffEmail(e.target.value)}
            />
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
