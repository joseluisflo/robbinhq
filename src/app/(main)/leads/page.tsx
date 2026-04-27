'use client';

import { useActiveAgent } from '../layout';
import { LeadsHeader } from '@/components/leads/LeadsHeader';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { useAgentLeads } from '@/hooks/use-agent-domain';

export default function LeadsPage() {
  const { activeAgent } = useActiveAgent();
  const { leads, loading } = useAgentLeads(activeAgent?.id);

  return (
    <div className="space-y-8">
      <LeadsHeader leads={leads} />
      <LeadsTable data={leads} loading={loading} />
    </div>
  );
}
