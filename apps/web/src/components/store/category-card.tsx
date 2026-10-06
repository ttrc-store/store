import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
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

// Fallback SVG icon grid per category slug
function CategoryPlaceholderIcon({ slug }: { slug: string }) {
  const color = '#844AFB';
  if (slug.includes('robot') || slug.includes('gamified')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="10" y="14" width="20" height="16" rx="3" stroke={color} strokeWidth="2" />
        <circle cx="15" cy="22" r="2.5" fill={color} />
        <circle cx="25" cy="22" r="2.5" fill={color} />
        <rect x="17" y="8" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <line x1="20" y1="14" x2="20" y2="8" stroke={color} strokeWidth="1.5" />
        <line x1="10" y1="20" x2="6" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="20" x2="34" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (slug.includes('stem')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="8" y="8" width="24" height="24" rx="3" stroke={color} strokeWidth="2" />
        <rect x="14" y="14" width="5" height="5" fill={color} opacity="0.5" rx="1" />
        <rect x="21" y="14" width="5" height="5" fill={color} rx="1" />
        <rect x="14" y="21" width="5" height="5" fill={color} rx="1" />
        <rect x="21" y="21" width="5" height="5" fill={color} opacity="0.5" rx="1" />
      </svg>
    );
  }
  if (slug.includes('fastener') || slug.includes('screw')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <circle cx="20" cy="20" r="10" stroke={color} strokeWidth="2" />
        <path d="M20 10 L20 30 M13 17 L27 17 M13 23 L27 23" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (slug.includes('batter') || slug.includes('power')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="8" y="13" width="24" height="14" rx="3" stroke={color} strokeWidth="2" />
        <rect x="32" y="17" width="3" height="6" rx="1.5" fill={color} />
        <path d="M14 20 L18 14 L18 20 L22 20 L18 26 L18 20 Z" fill={color} />
      </svg>
    );
  }
  if (slug.includes('motor')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <circle cx="20" cy="20" r="10" stroke={color} strokeWidth="2" />
        <circle cx="20" cy="20" r="4" fill={color} />
        <line x1="8" y1="16" x2="4" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="20" x2="4" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="24" x2="4" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (slug.includes('sensor')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M8 32 Q20 8 32 32" stroke={color} strokeWidth="2" fill="none" />
        <circle cx="20" cy="24" r="4" fill={color} />
        <circle cx="20" cy="24" r="8" stroke={color} strokeWidth="1" opacity="0.4" />
      </svg>
    );
  }
  if (slug.includes('drone')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="16" y="16" width="8" height="8" rx="2" fill={color} />
        <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <circle cx="30" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <circle cx="10" cy="30" r="4" stroke={color} strokeWidth="1.5" />
        <circle cx="30" cy="30" r="4" stroke={color} strokeWidth="1.5" />
        <line x1="13" y1="13" x2="17" y2="17" stroke={color} strokeWidth="1.5" />
        <line x1="27" y1="13" x2="23" y2="17" stroke={color} strokeWidth="1.5" />
        <line x1="13" y1="27" x2="17" y2="23" stroke={color} strokeWidth="1.5" />
        <line x1="27" y1="27" x2="23" y2="23" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (slug.includes('wire') || slug.includes('connect')) {
    return (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M6 20 Q14 8 20 20 Q26 32 34 20" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="6" cy="20" r="3" fill={color} />
        <circle cx="34" cy="20" r="3" fill={color} />
      </svg>
    );
  }
  // Default
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden="true">
      <rect x="8" y="8" width="24" height="24" rx="4" stroke={color} strokeWidth="2" />
      <path d="M14 20 H26 M20 14 V26" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CategoryCard({
  slug,
  name,
  description,
  itemCount,
  imageUrl,
  className,
}: CategoryCardProps) {
  const hasImage = imageUrl && !imageUrl.includes('ttrc-logo') && !imageUrl.startsWith('/brand/');

  return (
    <Link href={`/category/${slug}`} className="block group" aria-label={`Browse ${name}`}>
      <div
        className={cn(
          'relative overflow-hidden bg-white border border-slate-200 rounded-2xl hover:border-[#844AFB] hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 cursor-pointer',
          className
        )}
      >
        {/* Image area */}
        <div className="relative h-28 sm:h-32 w-full bg-[#EEE8FA]/40 overflow-hidden flex items-center justify-center">
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full group-hover:scale-110 transition-transform duration-300">
              <CategoryPlaceholderIcon slug={slug} />
            </div>
          )}
          {/* Gradient overlay on image */}
          {hasImage && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          )}
        </div>

        {/* Text area */}
        <div className="p-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-bold text-[#050507] group-hover:text-[#6721F2] transition-colors leading-snug truncate">
              {name}
            </h3>
            {description && (
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{description}</p>
            )}
            <p className="text-[11px] font-mono font-semibold text-[#844AFB] mt-1">
              {itemCount !== undefined
                ? `${itemCount} Product${itemCount === 1 ? '' : 's'}`
                : 'Browse'}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#844AFB] group-hover:bg-[#EEE8FA] group-hover:border-purple-200 transition-all flex-shrink-0">
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
