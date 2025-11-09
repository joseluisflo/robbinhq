import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function WorkflowPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Workflow</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>
      <p>Configure agent workflows here.</p>
    </div>
  );
}
