import * as React from 'react';
import { formatRupees, calculateDiscount, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface PriceDisplayProps {
  pricePaise: number;
  mrpPaise?: number;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  showDiscountBadge?: boolean;
  unit?: string;
  className?: string;
}

export function PriceDisplay({
  pricePaise,
  mrpPaise,
  size = 'default',
  showDiscountBadge = true,
  unit,
  className,
}: PriceDisplayProps) {
  const discount = mrpPaise && mrpPaise > pricePaise ? calculateDiscount(pricePaise, mrpPaise) : 0;

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap font-sans', className)}>
      {/* Authoritative Selling Price in Plus Jakarta Sans with Tabular Numerals */}
      <span
        className={cn('font-bold text-[#050507] tracking-tight tabular-nums', {
          'text-sm': size === 'sm',
          'text-lg sm:text-xl': size === 'default',
          'text-2xl sm:text-3xl': size === 'lg',
          'text-3xl sm:text-4xl': size === 'xl',
        })}
      >
        {formatRupees(pricePaise)}
      </span>

      {/* MRP strikethrough */}
      {mrpPaise && mrpPaise > pricePaise && (
        <span
          className={cn('line-through text-slate-400 tabular-nums font-medium', {
            'text-[11px]': size === 'sm',
            'text-xs sm:text-sm': size === 'default',
            'text-base': size === 'lg' || size === 'xl',
          })}
        >
          {formatRupees(mrpPaise)}
        </span>
      )}

      {/* Discount Badge */}
      {showDiscountBadge && discount > 0 && (
        <Badge
          variant="secondary"
          className="bg-[#EEE8FA] text-[#6721F2] border-purple-200/80 text-[10px] font-bold py-0 px-1.5"
        >
          {discount}% OFF
        </Badge>
      )}

      {/* Unit suffix if present */}
      {unit && (
        <span className="text-[11px] text-slate-500 font-medium lowercase">
          / {unit}
        </span>
      )}
    </div>
  );
}

// Re-export PriceTag for backwards compatibility
export const PriceTag = PriceDisplay;
