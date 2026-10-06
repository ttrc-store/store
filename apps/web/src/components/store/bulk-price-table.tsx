import * as React from 'react';
import { formatRupees, calculateDiscount, cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export interface BulkPriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPricePaise: number;
}

export interface BulkPriceTableProps {
  tiers: BulkPriceTier[];
  basePricePaise: number;
  currentQuantity?: number;
  unit?: string;
  className?: string;
}

export function BulkPriceTable({
  tiers,
  basePricePaise,
  currentQuantity = 1,
  unit = 'piece',
  className,
}: BulkPriceTableProps) {
  if (!tiers || tiers.length === 0) return null;

  // Sort tiers by minQuantity ascending
  const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);

  return (
    <div className={cn('rounded-xl border border-purple-200/80 bg-white overflow-hidden shadow-2xs', className)}>
      <div className="bg-[#EEE8FA]/60 px-4 py-2.5 border-b border-purple-200/80 flex items-center justify-between">
        <span className="text-xs font-bold text-[#1E0D45] flex items-center gap-1.5 uppercase tracking-wider">
          <Layers size={14} className="text-[#844AFB]" /> Wholesale & Bulk Tiers
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          Save up to{' '}
          {Math.max(...sortedTiers.map((t) => calculateDiscount(t.unitPricePaise, basePricePaise)))}%
        </span>
      </div>

      <div className="divide-y divide-slate-100 text-xs">
        {sortedTiers.map((tier, idx) => {
          const discount = calculateDiscount(tier.unitPricePaise, basePricePaise);
          const nextTier = sortedTiers[idx + 1];
          const maxQty = tier.maxQuantity ?? (nextTier ? nextTier.minQuantity - 1 : undefined);
          const qtyLabel = maxQty ? `${tier.minQuantity}–${maxQty} ${unit}s` : `${tier.minQuantity}+ ${unit}s`;
          const isActive =
            currentQuantity >= tier.minQuantity && (!maxQty || currentQuantity <= maxQty);

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 transition-colors',
                isActive ? 'bg-[#EEE8FA]/40 font-semibold text-[#6721F2]' : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    isActive ? 'bg-[#844AFB]' : 'bg-slate-300'
                  )}
                />
                {qtyLabel}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-bold tabular-nums text-slate-900">
                  {formatRupees(tier.unitPricePaise)}
                </span>
                {discount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {discount}% off
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
