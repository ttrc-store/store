'use client';

import * as React from 'react';
import { GitCompare, Check } from 'lucide-react';
import { useCompareStore, CompareProductItem } from '@/store/use-compare';
import { cn } from '@/lib/utils';

interface AddToCompareButtonProps {
  product: CompareProductItem;
  className?: string;
  variant?: 'icon' | 'button';
}

export function AddToCompareButton({ product, className, variant = 'icon' }: AddToCompareButtonProps) {
  const { isInCompare, addToCompare, removeFromCompare } = useCompareStore();
  const [mounted, setMounted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const active = mounted && isInCompare(product.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (active) {
      removeFromCompare(product.id);
      setFeedback('Removed');
      setTimeout(() => setFeedback(null), 1500);
    } else {
      const res = addToCompare(product);
      setFeedback(res.success ? 'Added' : 'Limit reached');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
          active
            ? 'bg-[#844AFB] text-white border-[#844AFB]'
            : 'bg-white text-slate-700 border-slate-200 hover:border-[#844AFB] hover:text-[#844AFB]',
          className
        )}
        title={active ? 'Remove from Comparison' : 'Add to Product Comparison'}
      >
        {active ? <Check size={14} /> : <GitCompare size={14} />}
        <span>{feedback || (active ? 'In Comparison' : 'Compare')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border',
        active
          ? 'bg-[#844AFB] text-white border-[#844AFB]'
          : 'bg-white/90 backdrop-blur-xs text-slate-700 border-slate-200 hover:border-[#844AFB] hover:text-[#844AFB] hover:bg-white',
        className
      )}
      title={active ? 'Remove from Comparison' : 'Add to Product Comparison'}
      aria-label="Add to Product Comparison"
    >
      {active ? <Check size={14} /> : <GitCompare size={14} />}
    </button>
  );
}
