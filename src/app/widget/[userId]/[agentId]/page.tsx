
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Agent, AgentFile, TextSource } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { ChatWidgetPublic } from '@/components/chat-widget-public';


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
        const agentDocRef = doc(firestore, 'users', userId, 'agents', agentId);
        const agentSnap = await getDoc(agentDocRef);

        if (agentSnap.exists()) {
          const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
          
          const textsQuery = collection(firestore, 'users', userId, 'agents', agentId, 'texts');
          const filesQuery = collection(firestore, 'users', userId, 'agents', agentId, 'files');

          const [textsSnapshot, filesSnapshot] = await Promise.all([
             getDocs(textsQuery),
             getDocs(filesQuery)
          ]);

          agentData.textSources = textsSnapshot.docs.map(d => d.data() as TextSource);
          agentData.fileSources = filesSnapshot.docs.map(d => d.data() as AgentFile);

          setAgent(agentData);

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
      <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
        <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>
      </div>
    );
  }
  
  if (!agent) {
    return null; // Should be covered by error state, but for safety
  }

  return (
    <div className="h-screen">
        <ChatWidgetPublic agent={agent} />
    </div>
  )
}
