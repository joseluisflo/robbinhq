'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateAgent } from '@/app/actions/agents';
import type { Agent } from '@/lib/types';

export function useDeployEmail() {
  const { activeAgent, setActiveAgent } = useActiveAgent();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  const [emailSignature, setEmailSignature] = useState('');
  const [handoffEmail, setHandoffEmail] = useState('');

  const agentEmailDomain = process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_EMAIL_INGEST_DOMAIN || 'your-domain.com';

  const isChanged = useMemo(() => 
    emailSignature !== (activeAgent?.emailSignature || '') ||
    handoffEmail !== (activeAgent?.handoffEmail || ''),
    [emailSignature, handoffEmail, activeAgent]
  );

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
  };

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
  
  return {
    isSaving,
    isChanged,
    emailSignature,
    setEmailSignature,
    handoffEmail,
    setHandoffEmail,
    uniqueAgentEmail,
    handleSaveChanges,
    handleCopy
  };
}
