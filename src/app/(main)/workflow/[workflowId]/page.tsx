'use client';

import { useParams } from 'next/navigation';

export default function WorkflowDetailPage() {
  const params = useParams() as { workflowId: string };
  const workflowName = params.workflowId.replace(/-/g, ' ');

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight capitalize">
        {workflowName}
      </h2>
      <p>Details for this workflow will be displayed here.</p>
    </div>
  );
}
