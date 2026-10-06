import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CollectionCardProps {
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string;
  badge?: string;
  className?: string;
}

export function CollectionCard({
  title,
  subtitle,
  href,
  imageUrl = '/brand/ttrc-logo.png',
  badge,
  className,
}: CollectionCardProps) {
  return (
    <Link href={href} className="group block focus:outline-none">
      <Card
        className={cn(
          'relative overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:border-[#844AFB] hover:shadow-lg hover:-translate-y-0.5',
          className
        )}
      >
        <div className="relative h-44 sm:h-52 w-full bg-[#EEE8FA]/40 overflow-hidden flex items-center justify-center p-4">
          <div className="relative size-full transform group-hover:scale-105 transition-transform duration-300">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          {badge && (
            <span className="absolute top-3 left-3 bg-[#844AFB] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs">
              {badge}
            </span>
          )}
        </div>

        <div className="p-4 bg-white flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-[#050507] group-hover:text-[#6721F2] transition-colors">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
          </div>
          <div className="size-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[#EEE8FA] group-hover:text-[#844AFB] flex items-center justify-center shrink-0 transition-colors">
            <ArrowRight size={16} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
