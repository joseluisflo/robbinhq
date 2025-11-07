import DashboardHeader from '@/components/layout/dashboard-header';

export default function DashboardMain({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashboardHeader />
      <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
    </div>
  );
}
