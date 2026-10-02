import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'purple' | 'red' | 'orange' | 'kit' | 'spare' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2',
        variant === 'default' && 'bg-red-600 text-white font-bold',
        variant === 'secondary' && 'bg-red-50 text-red-900 border border-red-200',
        variant === 'outline' && 'border border-red-200 text-red-900',
        (variant === 'purple' || variant === 'red' || variant === 'orange' || variant === 'kit') && 'bg-red-50 text-red-600 border border-red-200 font-bold',
        variant === 'spare' && 'bg-slate-100 text-slate-800 border border-slate-200 font-medium',
        variant === 'success' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        className
      )}
      {...props}
    />
  );
}
