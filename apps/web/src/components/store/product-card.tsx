// SERVER COMPONENT — no 'use client'.
// The wishlist button and Add to Cart are purely visual here;
// actual cart interaction is handled by ProductOrderBox on the product detail page.
// Removing 'use client' from ProductCard saves hydration for every card in the grid.

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from './price-tag';
import { RatingStars } from './rating-stars';
import { AddToCompareButton } from './add-to-compare-button';
import { cn } from '@/lib/utils';

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  productType?: 'kit' | 'spare_part' | 'standard';
  pricePaise: number;
  mrpPaise?: number;
  unit?: string;
  bulkPriceTiers?: Array<{ minQuantity: number; unitPricePaise: number }>;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  stockQty?: number;
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
  unit = 'Piece',
  bulkPriceTiers = [],
  rating = 0,
  reviewCount = 0,
  imageUrl = '/brand/ttrc-logo.png',
  stockQty = 0,
  className,
}: ProductCardProps) {
  const isOutOfStock = stockQty <= 0;

  const lowestBulkPricePaise =
    bulkPriceTiers && bulkPriceTiers.length > 0
      ? Math.min(...bulkPriceTiers.map((t) => t.unitPricePaise))
      : null;

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden bg-white border border-slate-200 hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
        className
      )}
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full bg-[#EEE8FA]/30 overflow-hidden flex items-center justify-center p-4">
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
          {productType === 'kit' && (
            <Badge variant="kit" className="bg-[#844AFB] text-white font-bold border-none shadow-xs">
              COMPLETE KIT
            </Badge>
          )}
          {productType === 'spare_part' && (
            <Badge variant="spare" className="bg-purple-100 text-purple-900 font-bold border-purple-200">
              SPARE PART
            </Badge>
          )}
          {lowestBulkPricePaise && lowestBulkPricePaise < pricePaise && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]">
              BULK PRICING
            </Badge>
          )}
        </div>

        {/* Add to Compare Quick Action */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <AddToCompareButton
            product={{
              id,
              slug,
              name,
              pricePaise,
              mrpPaise,
              imageUrl,
              brand,
              sku: slug,
              stockQty,
              unit,
              productType,
              bulkPriceTiers,
            }}
          />
        </div>

        <Link
          href={`/product/${slug}`}
          className="relative w-full h-full flex items-center justify-center"
          aria-label={`View ${name}`}
        >
          <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-300">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-contain p-2"
              loading="lazy"
            />
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-4 bg-white">
        {brand && (
          <span className="text-[11px] font-bold text-[#844AFB] uppercase tracking-wider mb-1">
            {brand}
          </span>
        )}

        <Link href={`/product/${slug}`} className="group-hover:text-[#6721F2] transition-colors">
          <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 mb-1 min-h-[40px]">
            {name}
          </h3>
        </Link>

        {rating > 0 && (
          <RatingStars rating={rating} reviewCount={reviewCount} size="sm" className="mb-2" />
        )}

        {lowestBulkPricePaise && lowestBulkPricePaise < pricePaise && (
          <p className="text-[11px] font-semibold text-emerald-700 mb-2">
            Bulk from ₹{(lowestBulkPricePaise / 100).toLocaleString('en-IN')} / {unit.toLowerCase()}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1">
              <PriceTag pricePaise={pricePaise} mrpPaise={mrpPaise} size="sm" />
              <span className="text-[10px] text-slate-500 font-medium">/ {unit.toLowerCase()}</span>
            </div>
          </div>

          {/* Link-based CTA — no JS, works without hydration */}
          <Link
            href={`/product/${slug}`}
            aria-label={isOutOfStock ? `${name} — Out of Stock` : `Add ${name} to cart`}
            className={cn(
              'h-8 px-3 text-xs font-bold gap-1 rounded-xl inline-flex items-center transition-colors',
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                : 'bg-[#844AFB] hover:bg-[#6721F2] text-white shadow-sm'
            )}
          >
            <ShoppingCart size={13} />
            {isOutOfStock ? 'Sold Out' : 'Add'}
          </Link>
        </div>
      </div>
    </Card>
  );
}
