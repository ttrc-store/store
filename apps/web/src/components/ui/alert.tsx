import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-xl border p-4 text-sm flex items-start gap-3',
          {
            'bg-slate-50 border-slate-200 text-slate-900': variant === 'default',
            'bg-red-50 border-red-200 text-red-900': variant === 'destructive',
            'bg-emerald-50 border-emerald-200 text-emerald-900': variant === 'success',
            'bg-amber-50 border-amber-200 text-amber-900': variant === 'warning',
            'bg-[#EEE8FA] border-purple-200 text-[#1E0D45]': variant === 'info',
          },
          className
        )}
        {...props}
      >
        <div className="shrink-0 mt-0.5">
          {variant === 'destructive' && <AlertCircle className="size-4 text-red-600" />}
          {variant === 'success' && <CheckCircle2 className="size-4 text-emerald-600" />}
          {variant === 'warning' && <AlertTriangle className="size-4 text-amber-600" />}
          {variant === 'info' && <Info className="size-4 text-[#844AFB]" />}
          {variant === 'default' && <Info className="size-4 text-slate-500" />}
        </div>
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('font-semibold leading-none tracking-tight text-sm', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-xs opacity-90 leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';
