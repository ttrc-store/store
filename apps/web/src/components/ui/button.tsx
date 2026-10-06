import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'danger'
    | 'link'
    | 'glow';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#844AFB] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]',
          {
            // Primary / Default
            'bg-[#844AFB] text-white hover:bg-[#6721F2] active:bg-[#5213D1] shadow-sm font-semibold':
              variant === 'default' || variant === 'primary',
            // Glow
            'bg-gradient-to-r from-[#844AFB] to-[#6721F2] text-white font-bold hover:from-[#7639F5] hover:to-[#5713D8] shadow-md shadow-purple-900/20 hover:shadow-purple-900/35 hover:-translate-y-px':
              variant === 'glow',
            // Secondary
            'bg-[#EEE8FA] text-[#6721F2] hover:bg-[#E2D6F7] border border-purple-200/80 font-medium':
              variant === 'secondary',
            // Outline
            'border border-slate-200 bg-white hover:bg-[#EEE8FA]/50 hover:border-purple-300 text-[#1E0D45] font-medium shadow-2xs':
              variant === 'outline',
            // Ghost
            'hover:bg-[#EEE8FA]/60 text-[#1E0D45]': variant === 'ghost',
            // Destructive / Danger
            'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-sm font-semibold':
              variant === 'destructive' || variant === 'danger',
            // Link
            'text-[#844AFB] hover:text-[#6721F2] underline-offset-4 hover:underline p-0 h-auto font-medium active:scale-100':
              variant === 'link',
            // Sizes
            'h-8 px-3 text-xs gap-1.5': size === 'sm',
            'h-10 px-4 py-2 text-sm gap-2': size === 'default',
            'h-12 px-6 text-base font-semibold gap-2.5': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
