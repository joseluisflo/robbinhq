
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Info, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type EmbedType = 'chat-widget' | 'iframe';

export default function DeployChatPage() {
  const { activeAgent } = useActiveAgent();
  const { user } = useUser();
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');
  const [snippet, setSnippet] = useState('');
  const [embedType, setEmbedType] = useState<EmbedType>('chat-widget');

  useEffect(() => {
    // This ensures window is defined, as it's only available on the client
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (!baseUrl || !activeAgent || !user) {
      setSnippet('');
      return;
    }

    if (embedType === 'chat-widget') {
      const script = `<script src="${baseUrl}/widget.js" data-user-id="${user.uid}" data-agent-id="${activeAgent.id}" defer></script>`;
      setSnippet(script);
    } else {
      const iframeSrc = `${baseUrl}/widget/${user.uid}/${activeAgent.id}`;
      const iframeTag = `<iframe\n  src="${iframeSrc}"\n  width="400"\n  height="600"\n  style="border:none; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"\n></iframe>`;
      setSnippet(iframeTag);
    }
  }, [baseUrl, activeAgent, user, embedType]);


  const handleCopy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    toast({
      title: 'Copied to clipboard!',
      description: 'You can now paste the code into your website\'s HTML.',
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy to Chat</h2>
        <Button>Save changes</Button>
      </div>

      {/* Allowed Domains Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Allowed domains
              <Info className="h-4 w-4 text-muted-foreground" />
            </h3>
            <p className="text-sm text-muted-foreground">
              Only allow embedding the agent on specific domains
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div>
          <Textarea
            placeholder="https://example.com"
            defaultValue={'https://example.com\nhttps://*.example.com'}
            rows={4}
          />
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
            <Info className="h-3 w-3" />
            Enter each domain in a new line
          </p>
        </div>
      </div>

      {/* Embed Type Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Embed type</h3>
        <RadioGroup
          value={embedType}
          onValueChange={(value: EmbedType) => setEmbedType(value)}
          className="space-y-4"
        >
          <Label
            htmlFor="chat-widget"
            className="flex items-start space-x-4 rounded-md border p-4 cursor-pointer has-[:checked]:border-primary"
          >
            <RadioGroupItem value="chat-widget" id="chat-widget" />
            <div className="grid gap-1.5">
              <span className="font-semibold">Chat widget</span>
              <span className="text-sm text-muted-foreground">
                Embed a chat bubble on your website. Allows you to use all the
                advanced features of the agent.
              </span>
            </div>
          </Label>
          <Label
            htmlFor="iframe"
            className="flex items-start space-x-4 rounded-md border p-4 cursor-pointer has-[:checked]:border-primary"
          >
            <RadioGroupItem value="iframe" id="iframe" />
            <div className="grid gap-1.5">
              <span className="font-semibold">Iframe</span>
              <span className="text-sm text-muted-foreground">
                Embed the chat interface directly using an iframe. Note: The chat
                will be always visible.
              </span>
            </div>
          </Label>
        </RadioGroup>
      </div>


      {/* Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle>{embedType === 'chat-widget' ? 'Widget setup' : 'Iframe setup'}</CardTitle>
          <CardDescription>
            {embedType === 'chat-widget'
              ? "Paste this code right before the closing `</body>` tag on any page you want the widget to appear."
              : "Paste this code where you want the chat iframe to appear in your website's HTML."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground mb-2">Your embed is configured for agent: <span className="font-semibold text-foreground">{activeAgent?.name || 'Loading...'}</span></p>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 p-4 border-t bg-muted/50 rounded-b-lg">
          <div className="relative w-full">
            <pre className="text-sm p-4 bg-background rounded-md overflow-x-auto font-mono">
              {snippet ? (
                <code>{snippet}</code>
              ) : (
                <Skeleton className="h-6 w-full" />
              )}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleCopy}
              disabled={!snippet}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
