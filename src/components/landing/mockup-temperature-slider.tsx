'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function MockupTemperatureSlider() {
  const [temperature, setTemperature] = useState(0.5);

  return (
    <Card className="w-full max-w-sm mx-auto p-4 shadow-md mb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature-mock" className="font-semibold">
            Temperature
          </Label>
          <span className="text-sm font-medium">{temperature}</span>
        </div>
        <Slider
          id="temperature-mock"
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
    </Card>
  );
}
