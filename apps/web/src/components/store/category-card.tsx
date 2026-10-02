import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Bot, Cpu, Wrench, BatteryCharging, Zap, Radio, Cable, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryCardProps {
  slug: string;
  name: string;
  itemCount?: number;
  iconName?: string;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  robot: <Bot className="w-8 h-8 text-red-600" />,
  stem: <Cpu className="w-8 h-8 text-red-600" />,
  fastener: <Wrench className="w-8 h-8 text-red-600" />,
  battery: <BatteryCharging className="w-8 h-8 text-red-600" />,
  motor: <Zap className="w-8 h-8 text-red-600" />,
  sensor: <Radio className="w-8 h-8 text-red-600" />,
  drone: <Bot className="w-8 h-8 text-red-600" />,
  wire: <Cable className="w-8 h-8 text-red-600" />,
};

export function CategoryCard({ slug, name, itemCount, iconName = 'robot', className }: CategoryCardProps) {
  return (
    <Link href={`/category/${slug}`}>
      <Card
        className={cn(
          'group relative p-5 flex flex-col justify-between bg-white border-slate-200 hover:border-red-600 transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
            {iconMap[iconName] || iconMap.robot}
          </div>
          <ArrowRight size={18} className="text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {itemCount !== undefined ? `${itemCount} Product${itemCount === 1 ? '' : 's'}` : 'View Products'}
          </p>
        </div>
      </Card>
    </Link>
  );
}
