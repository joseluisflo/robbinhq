import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/layout/dashboard-sidebar';
import DashboardMain from '@/components/layout/dashboard-main';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <Sidebar>
            <DashboardSidebar />
        </Sidebar>
        <DashboardMain>
            {children}
        </DashboardMain>
    </SidebarProvider>
  );
}
