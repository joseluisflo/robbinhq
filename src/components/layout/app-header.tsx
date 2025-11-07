import { AppBreadcrumbs } from '@/components/app-breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <AppBreadcrumbs />
      </div>
    </header>
  );
}
