'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'default';
  className?: string;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  size = 'default',
  className,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) onQuantityChange(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < max) onQuantityChange(quantity + 1);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-input bg-background',
        size === 'sm' ? 'h-8' : 'h-10',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="px-2.5 h-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground cursor-pointer"
        aria-label="Decrease quantity"
      >
        <Minus size={size === 'sm' ? 12 : 16} />
      </button>

      <span
        className={cn(
          'px-3 font-semibold font-mono text-center select-none text-foreground',
          size === 'sm' ? 'text-xs min-w-[24px]' : 'text-sm min-w-[32px]'
        )}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="px-2.5 h-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground cursor-pointer"
        aria-label="Increase quantity"
      >
        <Plus size={size === 'sm' ? 12 : 16} />
      </button>
    </div>
  );
}
