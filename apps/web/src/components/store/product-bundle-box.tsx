'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus, Check, ShoppingBag, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from '@/components/store/price-tag';
import { useCartStore } from '@/store/use-cart';

export interface BundleProductItem {
  id: string;
  name: string;
  slug: string;
  pricePaise: number;
  mrpPaise?: number;
  imageUrl?: string;
  gstPercent?: number;
  unit?: string;
  stockQty?: number;
  type?: 'kit' | 'spare_part' | 'standard';
}

interface ProductBundleBoxProps {
  kit: BundleProductItem;
  spares: BundleProductItem[];
}

export function ProductBundleBox({ kit, spares }: ProductBundleBoxProps) {
  const { addItem, openDrawer } = useCartStore();

  // State of selected spares (default: all checked)
  const [selectedSpareIds, setSelectedSpareIds] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    spares.forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  const [isAdded, setIsAdded] = React.useState(false);

  const toggleSpare = (id: string) => {
    setSelectedSpareIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Selected spares list
  const activeSpares = spares.filter((s) => selectedSpareIds[s.id]);

  // Compute bundle total
  const bundleTotalPaise =
    kit.pricePaise + activeSpares.reduce((sum, s) => sum + s.pricePaise, 0);

  const totalMrpPaise =
    (kit.mrpPaise || kit.pricePaise) +
    activeSpares.reduce((sum, s) => sum + (s.mrpPaise || s.pricePaise), 0);

  const totalItemsCount = 1 + activeSpares.length;
  const bundleSavingsPaise = Math.max(0, totalMrpPaise - bundleTotalPaise);

  const handleAddBundleToCart = () => {
    // 1. Add kit
    addItem({
      id: kit.id,
      slug: kit.slug,
      name: kit.name,
      pricePaise: kit.pricePaise,
      mrpPaise: kit.mrpPaise,
      imageUrl: kit.imageUrl || '/brand/ttrc-logo.png',
      quantity: 1,
      gstPercent: kit.gstPercent || 18,
      stockQty: kit.stockQty ?? 10,
      productType: (kit.type as any) || 'kit',
      unit: kit.unit || 'Kit',
    });

    // 2. Add each selected spare
    activeSpares.forEach((spare) => {
      addItem({
        id: spare.id,
        slug: spare.slug,
        name: spare.name,
        pricePaise: spare.pricePaise,
        mrpPaise: spare.mrpPaise,
        imageUrl: spare.imageUrl || '/brand/ttrc-logo.png',
        quantity: 1,
        gstPercent: spare.gstPercent || 18,
        stockQty: spare.stockQty ?? 10,
        productType: (spare.type as any) || 'spare_part',
        unit: spare.unit || 'Piece',
      });
    });

    setIsAdded(true);
    openDrawer();
    setTimeout(() => setIsAdded(false), 2500);
  };

  if (!spares || spares.length === 0) return null;

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-50/70 via-white to-purple-50/70 border border-purple-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="flex items-center gap-1.5 py-1 px-3">
            <Sparkles size={13} />
            <span>Frequently Bought Together Bundle</span>
          </Badge>
          <span className="text-xs text-slate-500 hidden sm:inline">
            • 100% Tested &amp; Mechanically Verified Compatibility
          </span>
        </div>
        {bundleSavingsPaise > 0 && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Save ₹{Math.round(bundleSavingsPaise / 100)} vs MRP
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Items visual rail (8 cols) */}
        <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
          {/* Item 1: Main Kit */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-purple-200 shadow-2xs min-w-[200px]">
            <div className="relative w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
              <Image
                src={kit.imageUrl || '/brand/ttrc-logo.png'}
                alt={kit.name}
                fill
                className="object-contain p-1.5"
                sizes="56px"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase text-[#844AFB] bg-purple-50 px-1.5 py-0.2 rounded">
                This Kit
              </span>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{kit.name}</p>
              <PriceTag pricePaise={kit.pricePaise} size="sm" />
            </div>
          </div>

          {/* Connected Spares */}
          {spares.map((spare) => {
            const isChecked = Boolean(selectedSpareIds[spare.id]);
            return (
              <React.Fragment key={spare.id}>
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Plus size={13} />
                </div>

                <div
                  onClick={() => toggleSpare(spare.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all min-w-[210px] select-none ${
                    isChecked
                      ? 'bg-white border-purple-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Controlled via card click
                    className="w-4 h-4 rounded text-[#844AFB] accent-[#844AFB] cursor-pointer flex-shrink-0"
                  />
                  <div className="relative w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                    <Image
                      src={spare.imageUrl || '/brand/ttrc-logo.png'}
                      alt={spare.name}
                      fill
                      className="object-contain p-1.5"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{spare.name}</p>
                    <PriceTag pricePaise={spare.pricePaise} size="sm" />
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Pricing & Add to Cart Column (4 cols) */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-purple-200 pt-4 lg:pt-0 lg:pl-6 space-y-3">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Combined Bundle Price ({totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'})
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <PriceTag pricePaise={bundleTotalPaise} size="lg" />
              {totalMrpPaise > bundleTotalPaise && (
                <span className="text-xs text-slate-400 line-through">
                  MRP: ₹{Math.round(totalMrpPaise / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleAddBundleToCart}
            disabled={isAdded}
            className="w-full bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs h-11 shadow-md shadow-purple-900/20 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isAdded ? (
              <>
                <CheckCircle2 size={16} className="text-white" />
                <span>Bundle Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>Add All {totalItemsCount} Items to Cart</span>
              </>
            )}
          </Button>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 justify-center">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Guaranteed mechanical &amp; connector fit</span>
          </p>
        </div>
      </div>
    </div>
  );
}
