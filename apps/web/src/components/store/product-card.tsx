// SERVER COMPONENT — no 'use client'.
// The wishlist button and Add to Cart are purely visual here;
// actual cart interaction is handled by ProductOrderBox on the product detail page.
// Removing 'use client' from ProductCard saves hydration for every card in the grid.

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { RatingStars } from './rating-stars';
import { AddToCompareButton } from './add-to-compare-button';
import { ProductShareButton } from './product-share-button';
import { formatRupees, calculateDiscount, cn } from '@/lib/utils';

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
  brand = 'Tamizh Tech',
  productType = 'standard',
  pricePaise,
  mrpPaise,
  unit = 'Piece',
  bulkPriceTiers = [],
  rating = 0,
  reviewCount = 0,
  imageUrl = '/brand/ttrc-logo.png',
  stockQty = 10,
  className,
}: ProductCardProps) {
  const isOutOfStock = stockQty <= 0;
  const discount = mrpPaise && mrpPaise > pricePaise ? calculateDiscount(pricePaise, mrpPaise) : 0;

  const lowestBulkPricePaise =
    bulkPriceTiers && bulkPriceTiers.length > 0
      ? Math.min(...bulkPriceTiers.map((t) => t.unitPricePaise))
      : null;

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-[#844AFB]/40 transition-all duration-300 overflow-hidden',
        className
      )}
    >
      {/* Top Floating Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {productType === 'kit' && (
          <span className="px-2 py-0.5 rounded-md bg-[#844AFB] text-white font-extrabold text-[10px] tracking-wide shadow-xs uppercase">
            Complete Kit
          </span>
        )}
        {productType === 'spare_part' && (
          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[10px] uppercase">
            Spare Part
          </span>
        )}
        {lowestBulkPricePaise && lowestBulkPricePaise < pricePaise && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px]">
            Bulk Tier
          </span>
        )}
      </div>

      {/* Action Buttons: Compare + Share */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
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
          className="w-7 h-7 bg-white/95 border border-slate-200/80 hover:bg-[#844AFB] hover:text-white hover:border-[#844AFB] shadow-xs text-slate-500 transition-colors"
        />
        <ProductShareButton
          slug={slug}
          name={name}
          pricePaise={pricePaise}
          variant="card"
          className="w-7 h-7 bg-white/95 border border-slate-200/80 hover:bg-[#844AFB] hover:text-white hover:border-[#844AFB] shadow-xs text-slate-500 transition-colors"
        />
      </div>

      {/* Product Image Area — Clean pure-white background with seamless mix-blend */}
      <Link
        href={`/product/${slug}`}
        className="relative aspect-square w-full bg-white flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b border-slate-100 cursor-pointer"
        aria-label={`View ${name}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-1 mix-blend-multiply transform group-hover:scale-108 transition-transform duration-300 ease-out"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 justify-between bg-white">
        <div>
          {/* Brand Tag & Stock Status */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold text-[#844AFB] uppercase tracking-wider truncate">
              {brand || 'Tamizh Tech'}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          </div>

          {/* Product Title */}
          <Link href={`/product/${slug}`} className="block group-hover:text-[#844AFB] transition-colors">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug min-h-[34px] sm:min-h-[38px]">
              {name}
            </h3>
          </Link>

          {/* Optional Rating */}
          {rating > 0 && (
            <div className="mt-1">
              <RatingStars rating={rating} reviewCount={reviewCount} size="sm" />
            </div>
          )}
        </div>

        {/* Pricing and Action Section */}
        <div className="pt-2.5 mt-3 border-t border-slate-100 flex flex-col gap-2">
          {/* Price line with discount badge */}
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight tabular-nums">
                {formatRupees(pricePaise)}
              </span>
              {mrpPaise && mrpPaise > pricePaise && (
                <span className="text-[11px] text-slate-400 line-through tabular-nums font-medium">
                  {formatRupees(mrpPaise)}
                </span>
              )}
            </div>

            {discount > 0 && (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Full-width Add to Cart / View Button */}
          <Link
            href={`/product/${slug}`}
            aria-label={isOutOfStock ? `${name} — Out of Stock` : `View ${name}`}
            className={cn(
              'w-full h-8 sm:h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs',
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                : 'bg-[#844AFB] hover:bg-[#6721F2] text-white hover:shadow-md hover:shadow-purple-900/15 active:scale-[0.98]'
            )}
          >
            <ShoppingCart size={13} />
            <span>{isOutOfStock ? 'Sold Out' : 'View Product'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
