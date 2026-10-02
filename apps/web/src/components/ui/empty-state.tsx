import * as React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/40 my-6',
        className
      )}
    >
      <div className="p-4 rounded-full bg-purple-50 text-purple-700 mb-3 border border-purple-200">
        {icon || <PackageOpen className="w-10 h-10" />}
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="glow" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
