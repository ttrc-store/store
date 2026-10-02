'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceTag } from '@/components/store/price-tag';
import { QuantitySelector } from '@/components/store/quantity-selector';

export default function FullCartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    couponCode,
    applyCoupon,
    removeCoupon,
    getTotals,
  } = useCartStore();

  const [inputCoupon, setInputCoupon] = React.useState('');
  const [couponMsg, setCouponMsg] = React.useState<{ success: boolean; message: string } | null>(null);

  const totals = getTotals();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon) return;
    const res = applyCoupon(inputCoupon);
    setCouponMsg(res);
  };

  return (
    <div className="min-h-screen bg-white text-foreground pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-purple-700" size={32} />
          Shopping Cart ({items.reduce((acc, i) => acc + i.quantity, 0)} Items)
        </h1>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
                {items.map((item) => (
                  <div key={item.id} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-bold text-sm text-slate-900 hover:text-purple-700 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Type: {item.productType.toUpperCase()} • GST: {item.gstPercent}%
                        </p>
                        <div className="flex items-center gap-2">
                          <PriceTag pricePaise={item.pricePaise} size="sm" />
                          {item.unit && <span className="text-xs text-slate-500">/ {item.unit.toLowerCase()}</span>}
                        </div>
                        {item.appliedTierLabel && (
                          <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                            Bulk Tier Applied: {item.appliedTierLabel}
                          </div>
                        )}
                        {item.bulkPriceTiers && item.bulkPriceTiers.length > 0 && (
                          (() => {
                            const sorted = [...item.bulkPriceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
                            const nextTier = sorted.find((t) => t.minQuantity > item.quantity);
                            if (!nextTier) return null;
                            const diff = nextTier.minQuantity - item.quantity;
                            return (
                              <p className="text-xs text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                Add {diff} more to unlock ₹{Math.round(nextTier.unitPricePaise / 100)} / {item.unit?.toLowerCase() || 'piece'}
                              </p>
                            );
                          })()
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="space-y-1 text-right">
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                          max={item.stockQty}
                        />
                        <p className="text-xs font-bold text-slate-900">
                          Total: ₹{((item.pricePaise * item.quantity) / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-2 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary & Coupon Sidebar */}
            <div className="space-y-6">
              {/* Coupon Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Tag size={16} className="text-purple-700" />
                  <span>Have a Promo Coupon?</span>
                </div>

                {couponCode ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    <span className="font-bold font-mono">Coupon: {couponCode} Applied</span>
                    <button onClick={removeCoupon} className="text-slate-500 hover:text-slate-900 font-bold">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input
                      placeholder="Try TTRC10 or FREESHIP"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      className="bg-white border-slate-200 text-xs h-10 uppercase focus:border-purple-600 focus:ring-purple-600"
                    />
                    <Button type="submit" variant="outline" className="border-purple-600 text-purple-700 hover:bg-purple-50 text-xs font-bold h-10">
                      Apply
                    </Button>
                  </form>
                )}

                {couponMsg && (
                  <p className={`text-[11px] ${couponMsg.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {couponMsg.message}
                  </p>
                )}
              </div>

              {/* Summary Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
                  Order Price Summary
                </h3>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Item Subtotal</span>
                    <PriceTag pricePaise={totals.subtotalPaise} size="sm" />
                  </div>

                  {totals.discountPaise > 0 && (
                    <div className="flex justify-between text-purple-700 font-semibold">
                      <span>Discount</span>
                      <span>- ₹{(totals.discountPaise / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {/* GST Breakdown */}
                  <div className="py-2 border-y border-slate-100 space-y-1 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>CGST (Intra-state TN)</span>
                      <span>₹{(totals.gstBreakdown.cgstPaise / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (Intra-state TN)</span>
                      <span>₹{(totals.gstBreakdown.sgstPaise / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span>{totals.isFreeShipping ? <strong className="text-purple-700">FREE</strong> : `₹${(totals.shippingPaise / 100).toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                    <span>Total Payable</span>
                    <PriceTag pricePaise={totals.totalPaise} size="lg" />
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full h-12 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2 rounded-full shadow-md shadow-purple-900/20 transition-colors glow-purple-sm"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4">
            <ShoppingBag size={56} className="mx-auto text-purple-600" />
            <h2 className="font-heading text-xl font-bold text-slate-900">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add competition kits, motors, batteries, or sensors to your shopping cart to proceed.
            </p>
            <Link
              href="/category/gamified-robots"
              className="inline-block px-6 py-2.5 rounded-full bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-sm glow-purple-sm transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
