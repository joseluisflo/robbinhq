
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Globe, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DeployPhonePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy to Phone</h2>
        <Button>Save changes</Button>
      </div>

      {/* Number Management Section */}
      <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold">Phone Number Management</h3>
            <p className="text-sm text-muted-foreground">
                Search, purchase, and assign a phone number for your agent.
            </p>
        </div>
        <div className="space-y-6">
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
                Phone number purchases and usage are billed directly through your platform account.
              </AlertDescription>
            </Alert>
        </div>
      </div>
      
    </div>
  );
}
