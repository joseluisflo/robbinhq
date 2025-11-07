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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className={cn(!isTrainingPage && 'p-4 sm:p-6')}>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}