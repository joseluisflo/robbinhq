
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Phone, Search, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DeployPhonePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy to Phone</h2>
        <Button>Save changes</Button>
      </div>

      {/* Provider Connection Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Telephony Provider Connection</h3>
          <p className="text-sm text-muted-foreground">
            Connect your provider account to purchase and manage phone numbers.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Phone className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold">Twilio Account</p>
              <p className="text-sm text-muted-foreground">Status: Not Connected</p>
            </div>
          </div>
          <Button variant="outline">Connect Account</Button>
        </div>
      </div>

      {/* Number Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Management</CardTitle>
          <CardDescription>
            Search, purchase, and assign a phone number for your agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="active-number" className="font-semibold">Active Number</Label>
            <div className="flex items-center justify-between p-4 mt-2 border rounded-lg">
                <p className="text-muted-foreground">No number assigned</p>
                <Button variant="secondary" size="sm">Manage</Button>
            </div>
          </div>
          <div>
            <Label htmlFor="search-number" className="font-semibold">Purchase a New Number</Label>
            <div className="flex gap-2 mt-2">
              <Select defaultValue="us">
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> US
                    </div>
                  </SelectItem>
                  <SelectItem value="ca">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> CA
                    </div>
                  </SelectItem>
                  <SelectItem value="gb">
                     <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> GB
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input id="search-number" placeholder="Area code or digits..." />
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
           <Alert variant="destructive">
              <AlertTitle>Billing Notice</AlertTitle>
              <AlertDescription>
                Phone number purchases and usage are billed directly through your connected Twilio account.
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
      
      {/* Voice Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Configuration</CardTitle>
          <CardDescription>
            Customize the agent's voice and how it behaves during calls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agent-voice">Agent Voice</Label>
            <Select defaultValue="alloy">
              <SelectTrigger id="agent-voice">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alloy">Alloy (Male)</SelectItem>
                <SelectItem value="echo">Echo (Male)</SelectItem>
                <SelectItem value="fable">Fable (Male)</SelectItem>
                <SelectItem value="onyx">Onyx (Male)</SelectItem>
                <SelectItem value="nova">Nova (Female)</SelectItem>
                <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Input id="welcome-message" placeholder="e.g., Hello, how can I help you today?" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
                <Label htmlFor="barge-in-toggle" className="font-medium">Enable Interruptions (Barge-in)</Label>
                <p className="text-sm text-muted-foreground">Allow callers to interrupt the agent while it's speaking.</p>
            </div>
            <Switch id="barge-in-toggle" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Card */}
      <Card className="border-destructive">
         <CardHeader>
          <CardTitle className="text-destructive">Disconnect Provider</CardTitle>
           <CardDescription>
            This will disconnect your account and release all assigned numbers. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter>
            <Button variant="destructive">Disconnect Provider</Button>
        </CardFooter>
      </Card>

    </div>
  );
}
