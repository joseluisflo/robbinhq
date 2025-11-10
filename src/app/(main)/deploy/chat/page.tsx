
'use client';

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
import { Info, Copy, ChevronsUpDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const codeSnippet = `
<script>
  (function() {
    if (!window.chatbase || window.chatbase("getState") !== "open") {
      // Your chatbase initialization code
    }
  })();
</script>
`.trim();

export default function DeployChatPage() {
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
        <RadioGroup defaultValue="chat-widget" className="space-y-4">
          <Label
            htmlFor="chat-widget"
            className="flex items-start space-x-4 rounded-md border p-4 cursor-pointer has-[:checked]:border-primary"
          >
            <RadioGroupItem value="chat-widget" id="chat-widget" />
            <div className="grid gap-1.5">
              <span className="font-semibold">Chat widget</span>
              <span className="text-sm text-muted-foreground">
                Embed a chat bubble on your website. Allows you to use all the
                advanced features of the agent. Explore the{' '}
                <a href="#" className="underline">
                  docs
                </a>
                .
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
                Embed the chat interface directly using an iframe. Note: Advanced
                features are not supported.
              </span>
            </div>
          </Label>
        </RadioGroup>
      </div>


      {/* Widget Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle>Widget setup</CardTitle>
          <CardDescription>
            Paste this code on your site (e.g., www.chatbase.co) to install the
            chat widget and enable AI-powered support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue="chatbase">
            <SelectTrigger>
              <SelectValue placeholder="Select a website" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chatbase">www.chatbase.co</SelectItem>
              <SelectItem value="example">www.example.com</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 p-4 border-t bg-muted/50 rounded-b-lg">
          <div className="relative w-full">
            <pre className="text-sm p-4 bg-background rounded-md overflow-x-auto font-mono">
              <code>{codeSnippet}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => navigator.clipboard.writeText(codeSnippet)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
