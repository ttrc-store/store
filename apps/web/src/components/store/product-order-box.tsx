'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Layers, CheckCircle2, FileText, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantitySelector } from '@/components/store/quantity-selector';
import { PriceTag } from '@/components/store/price-tag';
import { useCartStore } from '@/store/use-cart';
import { AddToCompareButton } from '@/components/store/add-to-compare-button';
import { ProductShareButton } from '@/components/store/product-share-button';
import { AddToWishlistButton } from '@/components/store/add-to-wishlist-button';
import { subscribeBackInStockAction } from '@/actions/stock-subscriptions';

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
  const { addItem, openDrawer, gstEnabled } = useCartStore();
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const [subEmail, setSubEmail] = React.useState('');
  const [submittingSub, setSubmittingSub] = React.useState(false);
  const [subSuccessMsg, setSubSuccessMsg] = React.useState<string | null>(null);
  const [subErrorMsg, setSubErrorMsg] = React.useState<string | null>(null);

  const handleSubscribeStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubmittingSub(true);
    setSubErrorMsg(null);
    try {
      const res = await subscribeBackInStockAction({
        productId: id,
        email: subEmail.trim(),
        variantId: activeConfig?.name || undefined,
      });
      if (res.error) {
        setSubErrorMsg(res.error);
      } else {
        setSubSuccessMsg(res.message || "You're registered for alerts!");
        setSubEmail('');
      }
    } catch {
      setSubErrorMsg('Failed to subscribe. Please try again.');
    } finally {
      setSubmittingSub(false);
    }
  };

  // Configuration variant selection
  const [selectedConfigIdx, setSelectedConfigIdx] = React.useState(() => {
    if (!configurations || configurations.length === 0) return 0;
    const defaultIdx = configurations.findIndex((c) => c.is_default);
    return defaultIdx >= 0 ? defaultIdx : 0;
  });

  const activeConfig = configurations && configurations.length > 0 ? configurations[selectedConfigIdx] : null;
  const isConfigPriceConfigured = activeConfig
    ? activeConfig.is_default
      ? true
      : activeConfig.price_paise != null
    : true;
  const currentBasePricePaise =
    activeConfig && !activeConfig.is_default && activeConfig.price_paise != null
      ? activeConfig.price_paise
      : basePricePaise;
  const currentMrpPaise =
    activeConfig && !activeConfig.is_default && activeConfig.mrp_paise != null
      ? activeConfig.mrp_paise
      : mrpPaise;

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
          <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            {gstEnabled ? (
              <>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                  Excl. GST
                </span>
                <span>+{gstPercent}% GST added on invoice at checkout • Delivery calculated at checkout</span>
              </>
            ) : (
              <span>Delivery calculated at checkout</span>
            )}
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
                    {config.is_default ? (
                      <span className="font-mono font-bold text-slate-900">
                        ₹{(basePricePaise / 100).toLocaleString('en-IN')}
                      </span>
                    ) : hasPrice ? (
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

      {/* Back-In-Stock Alert Card when out of stock */}
      {stockQty <= 0 && (
        <div className="p-4 rounded-xl bg-[#EEE8FA]/70 border border-purple-200 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E0D45]">
            <Bell size={16} className="text-[#844AFB] shrink-0" />
            <span>Notify Me When Back in Stock</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal">
            Be the first to know when this robotics item is restocked. Stock is allocated on a first-come, first-served basis and is not reserved.
          </p>
          {subSuccessMsg ? (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>{subSuccessMsg}</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribeStock} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                required
                className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#844AFB]"
              />
              <Button
                type="submit"
                size="sm"
                disabled={submittingSub || !subEmail.trim()}
                className="h-9 px-4 text-xs font-bold bg-[#844AFB] hover:bg-[#6721F2] text-white rounded-lg shrink-0 shadow-sm"
              >
                {submittingSub ? 'Subscribing...' : 'Alert Me'}
              </Button>
            </form>
          )}
          {subErrorMsg && (
            <p className="text-[11px] text-red-600 font-semibold">{subErrorMsg}</p>
          )}
        </div>
      )}

      {/* Quantity & CTA Buttons */}
      <div className="space-y-3">
        {/* Row 1: Quantity Selector + Add to Cart */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
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
            className="flex-1 bg-[#844AFB] hover:bg-[#6721F2] text-white font-extrabold text-xs sm:text-sm h-12 shadow-md shadow-purple-900/20 rounded-xl glow-purple-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={18} className="mr-2 shrink-0" />
            <span className="truncate">
              {!isConfigPriceConfigured
                ? 'Price Pending Admin Setup'
                : added
                ? 'Added to Cart ✓'
                : 'Add to Cart'}
            </span>
          </Button>
        </div>

        {/* Row 2: Buy Now full-width button */}
        <Button
          size="lg"
          onClick={handleBuyNow}
          disabled={!canAddToCart}
          variant="outline"
          className="w-full h-12 border-purple-300 text-purple-950 font-bold text-xs sm:text-sm hover:bg-purple-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap size={18} className="text-[#844AFB]" />
          <span>Buy Now with Express Checkout</span>
        </Button>

        {/* Row 3: Secondary Actions (Wishlist, Compare, Share) in equal responsive grid */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <AddToWishlistButton
            productId={id}
            productName={name}
            variant="button"
            className="h-10 w-full justify-center"
          />

          <AddToCompareButton
            variant="button"
            className="h-10 w-full px-2 justify-center"
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

          <ProductShareButton
            slug={slug}
            name={name}
            pricePaise={activeUnitPricePaise}
            variant="detail"
            className="h-10 w-full justify-center"
          />
        </div>
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
  );
}
