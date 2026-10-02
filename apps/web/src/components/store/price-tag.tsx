import * as React from 'react';
import { formatRupees, calculateDiscount, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface PriceTagProps {
  pricePaise: number;
  mrpPaise?: number;
  size?: 'sm' | 'default' | 'lg';
  showDiscountBadge?: boolean;
  className?: string;
}

export function PriceTag({
  pricePaise,
  mrpPaise,
  size = 'default',
  showDiscountBadge = true,
  className,
}: PriceTagProps) {
  const discount = mrpPaise ? calculateDiscount(pricePaise, mrpPaise) : 0;

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      {/* Selling Price */}
      <span
        className={cn('font-bold text-foreground tracking-tight font-mono', {
          'text-base': size === 'sm',
          'text-xl': size === 'default',
          'text-3xl': size === 'lg',
        })}
      >
        {formatRupees(pricePaise)}
      </span>

      {/* MRP strikethrough */}
      {mrpPaise && mrpPaise > pricePaise && (
        <span
          className={cn('line-through text-muted-foreground font-mono', {
            'text-xs': size === 'sm',
            'text-sm': size === 'default',
            'text-base': size === 'lg',
          })}
        >
          {formatRupees(mrpPaise)}
        </span>
      )}

      {/* Discount Badge */}
      {showDiscountBadge && discount > 0 && (
        <Badge className="bg-purple-700 text-white text-[10px] uppercase font-bold py-0 px-1.5 border-none shadow-xs">
          {discount}% OFF
        </Badge>
      )}
    </div>
  );
}
