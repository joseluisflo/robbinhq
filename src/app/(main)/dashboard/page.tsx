'use client';

import { useUser } from '@/firebase';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatCards } from '@/components/dashboard/StatCards';
import { LeadsOverview } from '@/components/dashboard/LeadsOverview';
import { CreditsUsage } from '@/components/dashboard/CreditsUsage';
import { InteractionChart } from '@/components/dashboard/InteractionChart';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="space-y-8">
      <WelcomeHeader name={user?.displayName} />
      <StatCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeadsOverview />
        <CreditsUsage />
      </div>
      
      <InteractionChart />
    </div>
  );
}
