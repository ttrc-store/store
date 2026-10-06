import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, LifeBuoy } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showSupportAction?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an unexpected error processing your request. Please try again.',
  onRetry,
  showSupportAction = true,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-white border border-red-100 rounded-2xl shadow-xs max-w-md mx-auto my-6',
        className
      )}
    >
      <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="font-heading font-bold text-base text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2 text-xs">
            <RefreshCw size={14} /> Retry
          </Button>
        )}
        {showSupportAction && (
          <Link href="/contact">
            <Button size="sm" variant="ghost" className="gap-2 text-xs text-slate-600">
              <LifeBuoy size={14} /> Contact Support
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
