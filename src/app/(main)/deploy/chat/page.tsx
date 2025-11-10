import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DeployChatPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Deploy to Chat</h2>
      <Card>
        <CardHeader>
          <CardTitle>Chat Widget Configuration</CardTitle>
          <CardDescription>
            Configure and install your chat widget on your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Chat deployment settings will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
