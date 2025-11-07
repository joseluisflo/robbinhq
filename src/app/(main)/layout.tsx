'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTrainingPage = pathname.startsWith('/training');
  const isDesignPage = pathname.startsWith('/design');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="grid h-screen grid-rows-[auto_1fr]">
        <AppHeader />
        <main className={cn("flex flex-col overflow-y-auto", !isTrainingPage && !isDesignPage && "p-4 sm:p-6")}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
