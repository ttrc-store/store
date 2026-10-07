'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Layers, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantitySelector } from '@/components/store/quantity-selector';
import { PriceTag } from '@/components/store/price-tag';
import { useCartStore } from '@/store/use-cart';
import { AddToCompareButton } from '@/components/store/add-to-compare-button';

export interface BulkPriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPricePaise: number;
}

export interface ProductConfiguration {
  name: string;
  price_paise?: number | null;
  mrp_paise?: number | null;
  is_default?: boolean;
  is_available?: boolean;
  description?: string;
}

interface ProductOrderBoxProps {
  id: string;
  slug: string;
  name: string;
  sku: string;
  basePricePaise: number;
  mrpPaise: number;
  stockQty: number;
  gstPercent: number;
  imageUrl: string;
  productType: 'kit' | 'spare_part' | 'standard';
  unit?: string;
  bulkPriceTiers?: BulkPriceTier[];
  configurations?: ProductConfiguration[];
}

export function ProductOrderBox({
  id,
  slug,
  name,
  sku,
  basePricePaise,
  mrpPaise,
  stockQty,
  gstPercent,
  imageUrl,
  productType,
  unit = 'Piece',
  bulkPriceTiers = [],
  configurations = [],
}: ProductOrderBoxProps) {
  const router = useRouter();
  const { addItem, openDrawer } = useCartStore();
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  // Configuration variant selection
  const [selectedConfigIdx, setSelectedConfigIdx] = React.useState(() => {
    if (!configurations || configurations.length === 0) return 0;
    const defaultIdx = configurations.findIndex((c) => c.is_default);
    return defaultIdx >= 0 ? defaultIdx : 0;
  });

  const activeConfig = configurations && configurations.length > 0 ? configurations[selectedConfigIdx] : null;
  const isConfigPriceConfigured = activeConfig ? activeConfig.price_paise != null : true;
  const currentBasePricePaise =
    activeConfig && activeConfig.price_paise != null ? activeConfig.price_paise : basePricePaise;
  const currentMrpPaise =
    activeConfig && activeConfig.mrp_paise != null ? activeConfig.mrp_paise : mrpPaise;

  // Compute active unit price based on selected quantity and bulk tiers
  const activeUnitPricePaise = React.useMemo(() => {
    if (!bulkPriceTiers || bulkPriceTiers.length === 0) return currentBasePricePaise;
    const sortedTiers = [...bulkPriceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity) {
        if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
          return tier.unitPricePaise;
        }
      }
    }
    return currentBasePricePaise;
  }, [quantity, currentBasePricePaise, bulkPriceTiers]);

  const activeTotalPricePaise = activeUnitPricePaise * quantity;
  const isBulkDiscountActive = activeUnitPricePaise < currentBasePricePaise;
  const savingsPct = isBulkDiscountActive
    ? Math.round(((currentBasePricePaise - activeUnitPricePaise) / currentBasePricePaise) * 100)
    : 0;

  const canAddToCart = stockQty > 0 && isConfigPriceConfigured;
  const itemName = activeConfig ? `${name} (${activeConfig.name})` : name;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem({
      id,
      slug,
      name: itemName,
      pricePaise: activeUnitPricePaise,
      basePricePaise: currentBasePricePaise,
      bulkPriceTiers,
      unit,
      mrpPaise: currentMrpPaise,
      imageUrl,
      quantity,
      gstPercent,
      stockQty,
      productType,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!canAddToCart) return;
    addItem({
      id,
      slug,
      name: itemName,
      pricePaise: activeUnitPricePaise,
      basePricePaise: currentBasePricePaise,
      bulkPriceTiers,
      unit,
      mrpPaise: currentMrpPaise,
      imageUrl,
      quantity,
      gstPercent,
      stockQty,
      productType,
    });
    router.push('/checkout');
  };

  return (
    <div className="space-y-5">
      {/* Price Header with Dynamic Bulk Updates */}
      <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Applicable Price
          </span>
          {isConfigPriceConfigured ? (
            <div className="flex items-baseline gap-2.5 mt-1">
              <PriceTag pricePaise={activeUnitPricePaise} size="lg" />
              <span className="text-sm font-semibold text-slate-600">/ {unit.toLowerCase()}</span>
              {currentMrpPaise > activeUnitPricePaise && (
                <span className="text-sm text-slate-400 line-through ml-1">
                  MRP: ₹{(currentMrpPaise / 100).toLocaleString('en-IN')}
                </span>
              )}
              {savingsPct > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Bulk Saving: {savingsPct}% Off
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Pricing Pending Configuration
              </span>
              <span className="text-xs text-slate-500">Configurable in Admin</span>
            </div>
          )}
          <span className="text-[11px] text-slate-500 mt-1 block">
            Inclusive of {gstPercent}% GST • Delivery calculated at checkout
          </span>
        </div>

        {quantity > 1 && isConfigPriceConfigured && (
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Subtotal ({quantity} items)
            </span>
            <div className="font-heading text-lg font-bold text-purple-900 mt-1">
              ₹{(activeTotalPricePaise / 100).toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      {/* Configuration / Variant Selector (e.g. Battery Option) */}
      {configurations && configurations.length > 0 && (
        <div className="space-y-2 p-3.5 rounded-xl border border-purple-100 bg-purple-50/30">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Select Configuration:</span>
            {activeConfig && (
              <span className="text-[11px] font-semibold text-purple-700">
                {activeConfig.name}
              </span>
            )}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {configurations.map((config, idx) => {
              const isSelected = selectedConfigIdx === idx;
              const hasPrice = config.price_paise != null;
              return (
                <button
                  key={config.name}
                  type="button"
                  onClick={() => setSelectedConfigIdx(idx)}
                  className={`p-2.5 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#844AFB] bg-white ring-2 ring-[#844AFB]/20 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:border-purple-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{config.name}</span>
                    {isSelected && <CheckCircle2 size={14} className="text-[#844AFB]" />}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    {hasPrice ? (
                      <span className="font-mono font-bold text-slate-900">
                        ₹{(config.price_paise! / 100).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Admin pricing pending
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {activeConfig && !isConfigPriceConfigured && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 leading-relaxed">
              <strong>Configuration Notice:</strong> Pricing for &quot;{activeConfig.name}&quot; is not yet published. The Admin can set its price in the Admin Panel before online purchases are enabled.
            </p>
          )}
        </div>
      )}

      {/* Bulk Pricing Tiers Table (Requirement 19) */}
      {bulkPriceTiers.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-white overflow-hidden shadow-xs">
          <div className="bg-[#EEE8FA] px-4 py-2 flex items-center justify-between text-xs font-bold text-[#1E0D45]">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-[#844AFB]" /> Wholesale &amp; Bulk Quantity Pricing
            </span>
            <span className="text-[10px] text-[#6721F2] font-semibold">Tier auto-applies</span>
          </div>
          <div className="divide-y divide-purple-100 text-xs">
            <div className="grid grid-cols-3 px-4 py-1.5 font-bold text-slate-500 text-[11px] bg-slate-50/50">
              <span>Quantity Range</span>
              <span>Price / Unit</span>
              <span className="text-right">Discount</span>
            </div>
            {bulkPriceTiers.map((tier, idx) => {
              const isCurrentTier =
                quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity);
              const tierSavings = Math.round(
                ((basePricePaise - tier.unitPricePaise) / basePricePaise) * 100
              );

              return (
                <div
                  key={idx}
                  className={`grid grid-cols-3 px-4 py-2 items-center transition-colors ${
                    isCurrentTier
                      ? 'bg-purple-100/60 font-bold text-purple-950 border-l-4 border-l-[#844AFB]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {tier.minQuantity}
                    {tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units
                    {isCurrentTier && <CheckCircle2 size={12} className="text-[#844AFB]" />}
                  </span>
                  <span className="font-mono text-purple-900">
                    ₹{(tier.unitPricePaise / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-right text-emerald-600 font-semibold">
                    {tierSavings > 0 ? `${tierSavings}% Off` : 'Standard'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Availability Indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            stockQty > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
          }`}
        />
        <span className="text-xs font-semibold text-slate-700">
          {stockQty > 0 ? 'In Stock' : 'Currently Out of Stock'}
        </span>
      </div>

      {/* Quantity & CTA Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs font-bold text-slate-700 sm:hidden">Quantity:</span>
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              max={stockQty > 0 ? stockQty : 1}
            />
          </div>

          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="flex-1 bg-[#844AFB] hover:bg-[#6721F2] text-white font-extrabold text-sm h-12 shadow-md shadow-purple-900/20 rounded-xl glow-purple-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={18} className="mr-2" />
            {!isConfigPriceConfigured
              ? 'Price Pending Admin Setup'
              : added
              ? 'Added to Cart ✓'
              : 'Add to Cart'}
          </Button>

          <Button
            size="lg"
            onClick={handleBuyNow}
            disabled={!canAddToCart}
            variant="outline"
            className="h-12 px-6 border-purple-300 text-purple-950 font-bold text-sm hover:bg-purple-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={18} className="mr-1 text-[#844AFB]" />
            Buy Now
          </Button>

          <AddToCompareButton
            variant="button"
            className="h-12 px-4"
            product={{
              id,
              slug,
              name,
              pricePaise: activeUnitPricePaise,
              mrpPaise,
              imageUrl,
              sku,
              stockQty,
              unit,
              productType,
              bulkPriceTiers,
            }}
          />
        </div>

        {/* High Volume / B2B Quote Trigger (Requirement 31) */}
        <div className="pt-2 text-center sm:text-left">
          <Link
            href={`/bulk-enquiry?sku=${encodeURIComponent(sku)}&product=${encodeURIComponent(name)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#844AFB] hover:text-[#6721F2] transition-colors"
          >
            <FileText size={14} />
            <span>Need 50+ units for schools, labs or industry? Request institutional quotation</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
