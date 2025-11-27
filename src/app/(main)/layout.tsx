'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, useCollection, useFirestore, collection, query, doc, useDoc } from '@/firebase';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CreateAgentDialog } from '@/components/create-agent-dialog';
import type { Agent, userProfile } from '@/lib/types';

// 1. Create a context to hold the active agent state
interface ActiveAgentContextType {
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;
  agents: Agent[];
  agentsLoading: boolean;
  userProfile: userProfile | null;
}

const ActiveAgentContext = createContext<ActiveAgentContextType | undefined>(undefined);

export function useActiveAgent() {
  const context = useContext(ActiveAgentContext);
  if (!context) {
    throw new Error('useActiveAgent must be used within an ActiveAgentProvider');
  }
  return context;
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  const agentsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'agents'));
  }, [firestore, user]);

  const { data: agents, loading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const userProfileRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, loading: profileLoading } = useDoc<userProfile>(userProfileRef);

  const [needsAgent, setNeedsAgent] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);
  
  useEffect(() => {
    if (!agentsLoading && agents && agents.length > 0 && !activeAgent) {
      setActiveAgent(agents[0]);
    }
  }, [agents, agentsLoading, activeAgent]);

  useEffect(() => {
    if (!agentsLoading && agents && agents.length === 0) {
      setNeedsAgent(true);
    } else {
      setNeedsAgent(false);
    }
  }, [agents, agentsLoading]);
  
  const isTrainingPage = pathname.startsWith('/training');
  const isDesignPage = pathname.startsWith('/design');
  const isWorkflowDetailPage = /^\/workflow\/.+/.test(pathname);
  const isChatLogsPage = pathname.startsWith('/chat-logs');

  const noPadding = isTrainingPage || isDesignPage || isWorkflowDetailPage || isChatLogsPage;

  const loading = userLoading || agentsLoading || profileLoading;

  if (loading && !agents) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  return (
    <ActiveAgentContext.Provider value={{ activeAgent, setActiveAgent, agents: agents || [], agentsLoading, userProfile }}>
      <SidebarProvider>
        {needsAgent && (
          <CreateAgentDialog 
            open={true}
            onAgentCreated={() => setNeedsAgent(false)}
          />
        )}
        <AppSidebar />
        <SidebarInset className="grid h-screen grid-rows-[auto_1fr]">
          <AppHeader />
          <main className={cn("flex flex-col overflow-y-auto", !noPadding && "p-4 sm:p-6")}>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ActiveAgentContext.Provider>
  );
}
