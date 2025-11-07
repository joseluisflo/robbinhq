import { AppSidebar } from '@/components/app-sidebar';
import DashboardMain from '@/components/layout/dashboard-main';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
    </div>
  );
}
