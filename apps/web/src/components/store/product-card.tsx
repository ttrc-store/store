'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PriceTag } from './price-tag';
import { RatingStars } from './rating-stars';
import { cn } from '@/lib/utils';

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  productType?: 'kit' | 'spare_part' | 'standard';
  pricePaise: number;
  mrpPaise?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  stockQty?: number;
  onAddToCart?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  slug,
  name,
  brand,
  productType = 'standard',
  pricePaise,
  mrpPaise,
  rating = 4.8,
  reviewCount = 12,
  imageUrl = '/brand/ttrc-logo.png',
  stockQty = 15,
  onAddToCart,
  className,
}: ProductCardProps) {
  const isOutOfStock = stockQty <= 0;

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden bg-white border border-slate-200 hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
        className
      )}
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full bg-purple-50/40 overflow-hidden flex items-center justify-center p-4">
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
          {productType === 'kit' && <Badge variant="kit" className="bg-purple-700 text-white font-bold border-none shadow-xs">COMPLETE KIT</Badge>}
          {productType === 'spare_part' && <Badge variant="spare" className="bg-purple-100 text-purple-900 font-bold border-purple-200">SPARE PART</Badge>}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 shadow-xs text-slate-400 hover:text-purple-700 transition-colors cursor-pointer border border-slate-200"
        >
          <Heart size={16} />
        </button>

        <Link href={`/product/${slug}`} className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-300">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain p-2"
            />
          </div>
        </Link>
      </div>

      {/* Product Details Area */}
      <div className="flex flex-col flex-1 p-4 bg-white">
        {brand && (
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">
            {brand}
          </span>
        )}

        <Link href={`/product/${slug}`} className="group-hover:text-purple-700 transition-colors">
          <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 mb-1 min-h-[40px]">
            {name}
          </h3>
        </Link>

        <RatingStars rating={rating} reviewCount={reviewCount} size="sm" className="mb-3" />

        <div className="mt-auto flex items-end justify-between pt-2 border-t border-slate-100">
          <PriceTag pricePaise={pricePaise} mrpPaise={mrpPaise} size="sm" />

          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={() => onAddToCart && onAddToCart(id)}
            className="h-8 px-3 text-xs font-bold gap-1 bg-purple-700 hover:bg-purple-800 text-white shadow-sm rounded-xl"
          >
            <ShoppingCart size={13} />
            {isOutOfStock ? 'Sold Out' : 'Add'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
