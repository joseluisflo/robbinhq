

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SecuritySettingsProps {
  maxMessages: number;
  timeframe: number;
  limitExceededMessage: string;
  setMaxMessages: (value: number) => void;
  setTimeframe: (value: number) => void;
  setLimitExceededMessage: (value: string) => void;
}

export function SecuritySettings({
  maxMessages,
  timeframe,
  limitExceededMessage,
  setMaxMessages,
  setTimeframe,
  setLimitExceededMessage,
}: SecuritySettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Rate limit</h3>
        <p className="text-sm text-muted-foreground">
          Limit the number of messages sent from one device on the iframe and chat bubble to prevent abuse.
        </p>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          Limit to
          <Input
            type="number"
            className="w-20"
            value={maxMessages}
            onChange={(e) => setMaxMessages(parseInt(e.target.value, 10) || 0)}
          />
          messages every
          <Input
            type="number"
            className="w-24"
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value, 10) || 0)}
          />
          seconds.
        </div>
        <div>
          <Label htmlFor="limit-message">Message to show when limit is hit</Label>
          <Input
            id="limit-message"
            className="mt-2"
            value={limitExceededMessage}
            onChange={(e) => setLimitExceededMessage(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

    