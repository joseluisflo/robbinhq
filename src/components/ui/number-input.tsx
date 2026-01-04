'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  symbol?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min, max, step = 1, symbol = '$', ...props }, ref) => {
    
    const handleIncrement = () => {
      const numericValue = Number(value);
      if (isNaN(numericValue)) return;
      const newValue = numericValue + step;
      if (max === undefined || newValue <= max) {
        onChange(newValue);
      }
    };

    const handleDecrement = () => {
      const numericValue = Number(value);
      if (isNaN(numericValue)) return;
      const newValue = numericValue - step;
      if (min === undefined || newValue >= min) {
        onChange(newValue);
      }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '') {
        onChange(0);
      } else {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
            onChange(numericValue);
        }
      }
    };

    return (
      <div className="relative inline-flex items-center w-full">
        {symbol && (
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground text-sm peer-disabled:opacity-50">
            {symbol}
            </span>
        )}
        <Input
          ref={ref}
          type="text" // Use text to allow empty string and better control
          className={cn('peer pr-8', symbol ? 'ps-6' : 'ps-3', className)}
          value={value}
          onChange={handleInputChange}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center border-l border-input">
          <Button
            type="button"
            variant="ghost"
            className="h-1/2 w-8 p-0 rounded-none rounded-tr-md"
            onClick={handleIncrement}
            disabled={max !== undefined && Number(value) >= max}
          >
            <ChevronUpIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-1/2 w-8 p-0 rounded-none rounded-br-md"
            onClick={handleDecrement}
            disabled={min !== undefined && Number(value) <= min}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';