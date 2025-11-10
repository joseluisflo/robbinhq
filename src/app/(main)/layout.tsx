'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();

  const isTrainingPage = pathname.startsWith('/training');
  const isDesignPage = pathname.startsWith('/design');
  const isWorkflowDetailPage = /^\/workflow\/.+/.test(pathname);
  const isChatLogsPage = pathname.startsWith('/chat-logs');


  const noPadding = isTrainingPage || isDesignPage || isWorkflowDetailPage || isChatLogsPage;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="grid h-screen grid-rows-[auto_1fr]">
        <AppHeader />
        <main className={cn("flex flex-col overflow-y-auto", !noPadding && "p-4 sm:p-6")}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
