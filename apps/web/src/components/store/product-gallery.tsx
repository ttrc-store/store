'use client';

import * as React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ProductShareButton } from '@/components/store/product-share-button';
import { cn } from '@/lib/utils';

export interface ProductGalleryProps {
  images: string[];
  productName: string;
  productType?: 'kit' | 'spare_part' | 'standard';
  slug: string;
  pricePaise: number;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  productType = 'standard',
  slug,
  pricePaise,
  className,
}: ProductGalleryProps) {
  const safeImages = images && images.length > 0 ? images : ['/brand/ttrc-logo.png'];
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const activeImage = safeImages[selectedIndex] || safeImages[0];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Hero Image Frame */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center group shadow-sm transition-all duration-200">
        <Image
          src={activeImage}
          alt={`${productName} — view ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
        />

        {/* Product Type Badge */}
        <span className="absolute top-4 left-4 z-10 pointer-events-none">
          <Badge
            variant={productType === 'kit' ? 'purple' : 'default'}
            className={
              productType === 'kit'
                ? 'bg-[#844AFB] text-white font-bold border-none shadow-xs text-xs'
                : 'bg-slate-100 text-slate-800 font-bold border-slate-200 text-xs'
            }
          >
            {productType === 'kit'
              ? 'Complete Kit'
              : productType === 'spare_part'
              ? 'Spare Part'
              : 'Standard Component'}
          </Badge>
        </span>

        {/* Share Quick Action */}
        <div className="absolute top-4 right-4 z-10">
          <ProductShareButton
            slug={slug}
            name={productName}
            pricePaise={pricePaise}
            variant="card"
          />
        </div>

        {/* Image Counter Badge if multiple images */}
        {safeImages.length > 1 && (
          <span className="absolute bottom-3 right-3 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-900/70 text-white backdrop-blur-xs">
            {selectedIndex + 1} / {safeImages.length}
          </span>
        )}
      </div>

      {/* Interactive Thumbnail Carousel */}
      {safeImages.length > 1 && (
        <div
          role="tablist"
          aria-label="Product thumbnails"
          className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin"
        >
          {safeImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Select view ${idx + 1} of ${productName}`}
                onClick={() => setSelectedIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedIndex(idx);
                  }
                }}
                className={cn(
                  'relative w-20 h-20 rounded-xl bg-slate-50 border-2 overflow-hidden cursor-pointer transition-all duration-150 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#844AFB]',
                  isSelected
                    ? 'border-[#844AFB] ring-2 ring-purple-200 shadow-sm scale-102 bg-white'
                    : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                )}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
