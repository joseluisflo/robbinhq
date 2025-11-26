

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Info, PlusCircle, X } from 'lucide-react';
import { AddStarterDialog } from '@/components/add-starter-dialog';

interface InstructionSettingsProps {
  instructions: string;
  setInstructions: (value: string) => void;
  starters: string[];
  handleAddStarter: (starter: string) => void;
  handleRemoveStarter: (index: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
}

export function InstructionSettings({
  instructions,
  setInstructions,
  starters,
  handleAddStarter,
  handleRemoveStarter,
  temperature,
  setTemperature,
}: InstructionSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="instructions" className="text-base font-semibold">
          Instructions
        </Label>
        <Textarea
          id="instructions"
          placeholder="Give your agent a role and instructions..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="mt-2 min-h-[300px] text-sm font-mono"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            Conversation starters
            <Info className="h-4 w-4 text-muted-foreground" />
          </Label>
          <AddStarterDialog onAddStarter={handleAddStarter}>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </AddStarterDialog>
        </div>
        {starters.length === 0 ? (
          <Card className="text-center">
            <CardContent className="p-8">
              <p className="font-semibold">No conversation starters yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add starter prompts to suggest below the chat input.
              </p>
              <AddStarterDialog onAddStarter={handleAddStarter}>
                <Button variant="secondary" className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add starter
                </Button>
              </AddStarterDialog>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {starters.map((starter, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm p-3 border rounded-lg bg-muted/50 text-left"
              >
                <span className="truncate pr-4">{starter}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemoveStarter(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label
            htmlFor="temperature"
            className="text-base font-semibold flex items-center gap-2"
          >
            Temperature
            <Info className="h-4 w-4 text-muted-foreground" />
          </Label>
          <span className="text-sm font-medium">{temperature}</span>
        </div>
        <Slider
          id="temperature"
          value={[temperature]}
          onValueChange={(value) => setTemperature(value[0])}
          max={1}
          step={0.1}
          className="mt-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Consistent</span>
          <span>Creative</span>
        </div>
      </div>
    </div>
  );
}

    