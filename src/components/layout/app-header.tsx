'use client';

import { AppBreadcrumbs } from '@/components/app-breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface AppHeaderProps {
  isWorkflowDetailPage?: boolean;
  onTestClick?: () => void;
}

export function AppHeader({ isWorkflowDetailPage, onTestClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <AppBreadcrumbs />
      </div>
      {isWorkflowDetailPage && (
        <Button variant="outline" size="sm" onClick={onTestClick}>
          <Play className="mr-2 h-4 w-4" />
          Test
        </Button>
      )}
    </header>
  );
}
