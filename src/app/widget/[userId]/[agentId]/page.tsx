'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Agent } from '@/lib/types';
import { ChatWidgetPreview } from '@/components/chat-widget-preview';
import { Loader2 } from 'lucide-react';

export default function WidgetPage({ params }: { params: { userId: string, agentId: string } }) {
  const { userId, agentId } = params;
  const firestore = useFirestore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !userId || !agentId) {
        setLoading(false);
        setError('Invalid parameters.');
        return;
    };

    const fetchAgent = async () => {
      try {
        const agentRef = doc(firestore, 'users', userId, 'agents', agentId);
        const agentSnap = await getDoc(agentRef);

        if (agentSnap.exists()) {
          setAgent({ id: agentSnap.id, ...agentSnap.data() } as Agent);
        } else {
          setError('Agent not found.');
        }
      } catch (err) {
        console.error('Error fetching agent:', err);
        setError('Failed to load agent.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [firestore, userId, agentId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-transparent">
        {/* We render the preview directly. It handles its own layout and sizing. */}
        <ChatWidgetPreview agent={agent} />
    </div>
  );
}
