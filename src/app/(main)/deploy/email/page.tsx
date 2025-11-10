import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DeployEmailPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Deploy to Email</h2>
      <Card>
        <CardHeader>
          <CardTitle>Email Integration</CardTitle>
          <CardDescription>
            Connect your agent to an email address to handle incoming inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Email deployment settings will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
