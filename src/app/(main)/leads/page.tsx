'use client';

import { useMemo } from 'react';
import { useActiveAgent } from '../layout';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import type { Lead } from '@/lib/types';
import { LeadsHeader } from '@/components/leads/LeadsHeader';
import { LeadsTable } from '@/components/leads/LeadsTable';

export default function LeadsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();

  const leadsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'leads'));
  }, [user, firestore, activeAgent?.id]);
  
  const { data: leads, loading } = useCollection<Lead>(leadsQuery);

  return (
    <div className="space-y-8">
      <LeadsHeader leads={leads} />
      <LeadsTable data={leads || []} loading={loading} />
    </div>
  );
}
