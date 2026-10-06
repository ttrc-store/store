'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, className, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-md bg-[#1E0D45] px-2.5 py-1 text-xs text-white shadow-md animate-fade-in-up pointer-events-none',
            {
              'bottom-full mb-1.5 left-1/2 -translate-x-1/2': side === 'top',
              'top-full mt-1.5 left-1/2 -translate-x-1/2': side === 'bottom',
              'right-full mr-1.5 top-1/2 -translate-y-1/2': side === 'left',
              'left-full ml-1.5 top-1/2 -translate-y-1/2': side === 'right',
            },
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
