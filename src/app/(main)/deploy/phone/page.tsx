import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DeployPhonePage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Deploy to Phone</h2>
      <Card>
        <CardHeader>
          <CardTitle>Phone Integration</CardTitle>
          <CardDescription>
            Integrate your agent with a phone number to handle calls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Phone deployment settings will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
