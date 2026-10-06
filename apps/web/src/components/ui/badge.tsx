import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'danger'
    | 'success'
    | 'warning'
    | 'info'
    | 'kit'
    | 'spare'
    | 'purple'
    | 'red';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#844AFB] focus:ring-offset-2',
        (variant === 'default' || variant === 'primary' || variant === 'kit' || variant === 'purple') &&
          'bg-[#844AFB] text-white font-bold shadow-xs',
        variant === 'secondary' &&
          'bg-[#EEE8FA] text-[#6721F2] border border-purple-200/80 font-medium',
        variant === 'outline' &&
          'border border-purple-200 text-[#844AFB] bg-white font-medium',
        (variant === 'destructive' || variant === 'danger' || variant === 'red') &&
          'bg-red-50 text-red-600 border border-red-200 font-bold',
        variant === 'success' &&
          'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
        variant === 'warning' &&
          'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
        variant === 'info' &&
          'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
        variant === 'spare' &&
          'bg-slate-100 text-slate-800 border border-slate-200 font-medium',
        className
      )}
      {...props}
    />
  );
}
