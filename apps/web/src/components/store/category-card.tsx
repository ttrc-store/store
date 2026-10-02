import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Bot, Cpu, Wrench, BatteryCharging, Zap, Radio, Cable, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryCardProps {
  slug: string;
  name: string;
  description?: string;
  itemCount?: number;
  iconName?: string;
  imageUrl?: string;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  robot: <Bot className="w-7 h-7 text-[#844AFB]" />,
  stem: <Cpu className="w-7 h-7 text-[#844AFB]" />,
  fastener: <Wrench className="w-7 h-7 text-[#844AFB]" />,
  battery: <BatteryCharging className="w-7 h-7 text-[#844AFB]" />,
  motor: <Zap className="w-7 h-7 text-[#844AFB]" />,
  sensor: <Radio className="w-7 h-7 text-[#844AFB]" />,
  drone: <Bot className="w-7 h-7 text-[#844AFB]" />,
  wire: <Cable className="w-7 h-7 text-[#844AFB]" />,
};

function getCategoryIcon(slug: string, iconName?: string) {
  if (iconName && iconMap[iconName]) return iconMap[iconName];
  if (slug.includes('robot')) return iconMap.robot;
  if (slug.includes('stem')) return iconMap.stem;
  if (slug.includes('fastener')) return iconMap.fastener;
  if (slug.includes('batter')) return iconMap.battery;
  if (slug.includes('motor')) return iconMap.motor;
  if (slug.includes('sensor')) return iconMap.sensor;
  if (slug.includes('drone')) return iconMap.drone;
  if (slug.includes('wire') || slug.includes('connect')) return iconMap.wire;
  return <Bot className="w-7 h-7 text-[#844AFB]" />;
}

export function CategoryCard({
  slug,
  name,
  description,
  itemCount,
  iconName,
  className,
}: CategoryCardProps) {
  const icon = getCategoryIcon(slug, iconName);

  return (
    <Link href={`/category/${slug}`} className="block h-full group">
      <Card
        className={cn(
          'p-5 h-full flex flex-col justify-between bg-white border border-slate-200 rounded-2xl hover:border-[#844AFB] transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden group-hover:-translate-y-0.5',
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 rounded-xl bg-[#EEE8FA] group-hover:bg-[#EEE8FA]/80 transition-colors">
            {icon}
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#844AFB] group-hover:bg-[#EEE8FA] transition-all">
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-heading text-base sm:text-lg font-bold text-[#050507] group-hover:text-[#6721F2] transition-colors leading-snug">
            {name}
          </h3>
          {description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
          <p className="text-[11px] font-mono font-semibold text-[#844AFB] pt-1">
            {itemCount !== undefined
              ? `${itemCount} Product${itemCount === 1 ? '' : 's'}`
              : 'Browse Hardware'}
          </p>
        </div>
      </Card>
    </Link>
  );
}
