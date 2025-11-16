
'use client';

import SiriOrb from '@/components/smoothui/ui/SiriOrb';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, MicOff } from 'lucide-react';
import type { ConnectionState } from '@/lib/types';

interface InCallViewProps {
  connectionState: ConnectionState;
  toggleCall: () => void;
  orbColors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
}

export function InCallView({ connectionState, toggleCall, orbColors }: InCallViewProps) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <SiriOrb size="160px" colors={orbColors} />
      </div>
      <div className="p-4 border-t bg-card flex justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <MicOff className="h-6 w-6" />
        </Button>
        <Button
          variant={connectionState === 'connected' ? 'destructive' : 'default'}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleCall}
          disabled={connectionState === 'connecting' || connectionState === 'closing'}
        >
          {connectionState === 'connected' ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
        </Button>
      </div>
    </>
  );
}

    