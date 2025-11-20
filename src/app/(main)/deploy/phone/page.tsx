'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Search, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useActiveAgent } from '@/app/(main)/layout';
import { searchAvailableNumbers } from '@/app/actions/twilio';
import { useToast } from '@/hooks/use-toast';

interface TwilioNumber {
    friendlyName: string;
    phoneNumber: string;
}

export default function DeployPhonePage() {
    const { activeAgent } = useActiveAgent();
    const { toast } = useToast();
    const [isSearching, startSearchTransition] = useTransition();

    const [country, setCountry] = useState('US');
    const [areaCode, setAreaCode] = useState('');
    const [availableNumbers, setAvailableNumbers] = useState<TwilioNumber[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = () => {
        if (!areaCode) {
            toast({ title: 'Area code is required', variant: 'destructive'});
            return;
        }
        setError(null);
        setAvailableNumbers([]);
        startSearchTransition(async () => {
            const result = await searchAvailableNumbers(country, areaCode);
            if ('error' in result) {
                setError(result.error);
                toast({ title: 'Search Failed', description: result.error, variant: 'destructive'});
            } else {
                setAvailableNumbers(result.data || []);
                if (!result.data || result.data.length === 0) {
                     toast({ title: 'No Numbers Found', description: 'Try a different area code or country.'});
                }
            }
        });
    }

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
          <div className="space-y-2">
            <Label htmlFor="active-number" className="font-semibold">Active Number</Label>
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{activeAgent?.phoneConfig?.phoneNumber || 'No number assigned'}</p>
                <Button variant="secondary" size="sm">Manage</Button>
            </div>
          </div>
          <div className="space-y-4">
            <Label htmlFor="search-number" className="font-semibold">Purchase a New Number</Label>
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Twilio Configuration Required</AlertTitle>
                <AlertDescription>
                    Ensure your Twilio Account SID and Auth Token are set in your environment variables to search for and purchase numbers.
                </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> US
                    </div>
                  </SelectItem>
                  <SelectItem value="CA">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> CA
                    </div>
                  </SelectItem>
                  <SelectItem value="GB">
                     <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> GB
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input 
                id="search-number" 
                placeholder="Area code (e.g. 415)" 
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>
          </div>

          {isSearching && (
             <div className="text-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="mt-2">Searching for numbers...</p>
             </div>
          )}

          {availableNumbers.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Available Numbers</CardTitle>
                    <CardDescription>Select a number to purchase and assign to your agent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {availableNumbers.map(num => (
                        <div key={num.phoneNumber} className="flex items-center justify-between p-3 border rounded-md">
                            <p className="font-mono text-sm">{num.friendlyName}</p>
                            <Button size="sm">Purchase</Button>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                     <p className="text-xs text-muted-foreground">Phone number purchases and usage are billed directly through your Twilio account.</p>
                </CardFooter>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
