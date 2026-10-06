import * as React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  isWarning?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isWarning = false,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs transition-all duration-200 hover:shadow-sm hover:border-purple-200',
        isWarning && 'border-amber-200 bg-amber-50/20',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            'size-9 rounded-xl flex items-center justify-center shrink-0',
            isWarning
              ? 'bg-amber-100 text-amber-700'
              : 'bg-[#EEE8FA] text-[#844AFB]'
          )}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3">
        <p className="font-heading font-extrabold text-2xl text-[#050507] tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-bold',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-slate-400 text-[11px]">{trend.label}</span>
          )}
        </div>
      )}
    </Card>
  );
}
