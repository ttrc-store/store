import * as React from 'react';
import { ShieldCheck, Truck, Receipt, Cpu, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrustStripProps {
  className?: string;
  variant?: 'full' | 'compact';
}

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    title: '100% Genuine Hardware',
    desc: 'Direct from Tamizh Tech labs and verified manufacturers.',
  },
  {
    icon: Truck,
    title: 'Fast Pan-India Dispatch',
    desc: 'Dispatched within 24h from Tamil Nadu warehouse.',
  },
  {
    icon: Receipt,
    title: 'GST Invoices & Compliance',
    desc: 'Full B2B/B2C tax invoices with intra/inter-state GST.',
  },
  {
    icon: Cpu,
    title: 'Tested by Engineers',
    desc: 'Every kit and module benchmarked for STEM & competitions.',
  },
];

export function TrustStrip({ className, variant = 'full' }: TrustStripProps) {
  return (
    <section
      aria-label="TTRC Store Trust and Reliability Features"
      className={cn(
        'border-y border-slate-200/80 bg-white py-6 sm:py-8',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {TRUST_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-[#EEE8FA]/30"
              >
                <div className="size-10 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-[#050507]">
                    {item.title}
                  </h4>
                  {variant === 'full' && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
