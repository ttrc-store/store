import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'glow' | 'secondary';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          {
            'bg-purple-700 text-white hover:bg-purple-800 active:bg-purple-900 shadow-sm': variant === 'default',
            'bg-gradient-to-r from-purple-700 to-purple-600 text-white font-bold hover:from-purple-800 hover:to-purple-700 shadow-md glow-purple-sm':
              variant === 'glow',
            'border border-purple-200 bg-white hover:bg-purple-50 text-purple-950 font-medium':
              variant === 'outline',
            'bg-purple-50 text-purple-950 hover:bg-purple-100 border border-purple-200':
              variant === 'secondary',
            'hover:bg-purple-50 text-purple-950': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-12 px-6 text-base font-semibold': size === 'lg',
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
