'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/use-cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { PriceTag } from '@/components/store/price-tag';
import { QuantitySelector } from '@/components/store/quantity-selector';

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, getTotals } = useCartStore();
  const totals = getTotals();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()} side="right">
      <SheetContent className="w-full sm:max-w-md bg-white text-slate-900 border-slate-200 p-0 flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <SheetHeader className="p-5 border-b border-slate-200 flex items-center justify-between">
          <SheetTitle className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="text-[#844AFB]" size={20} />
            Your Shopping Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})
          </SheetTitle>
          <SheetClose>
            <span className="text-slate-400 hover:text-slate-900 p-1 rounded-lg block cursor-pointer">
              <X size={20} />
            </span>
          </SheetClose>
        </SheetHeader>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="py-4 flex gap-4 items-start">
                <div className="relative w-16 h-16 rounded-xl bg-purple-50/50 border border-purple-100 flex-shrink-0 overflow-hidden">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeDrawer}
                    className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-[#844AFB] transition-colors"
                  >
                    {item.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <PriceTag pricePaise={item.pricePaise} size="sm" />
                    {item.unit && <span className="text-[11px] text-slate-500">/ {item.unit.toLowerCase()}</span>}
                  </div>
                  {item.appliedTierLabel && (
                    <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                      Bulk Tier: {item.appliedTierLabel}
                    </div>
                  )}
                  {item.bulkPriceTiers && item.bulkPriceTiers.length > 0 && (
                    (() => {
                      const sorted = [...item.bulkPriceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
                      const nextTier = sorted.find((t) => t.minQuantity > item.quantity);
                      if (!nextTier) return null;
                      const diff = nextTier.minQuantity - item.quantity;
                      return (
                        <p className="text-[10px] text-purple-700 font-medium bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                          Add {diff} more to unlock ₹{Math.round(nextTier.unitPricePaise / 100)} / {item.unit?.toLowerCase() || 'piece'}
                        </p>
                      );
                    })()
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <QuantitySelector
                      quantity={item.quantity}
                      onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                      max={item.stockQty}
                      size="sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        ₹{((item.pricePaise * item.quantity) / 100).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 rounded-full bg-purple-50 border border-purple-200 text-[#844AFB]">
                <ShoppingBag size={40} />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900">Your Cart is Empty</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Explore our Gamified Robotics Kits, Motors, Batteries, and Sensors!
              </p>
              <Link
                href="/category/gamified-robots"
                onClick={closeDrawer}
                className="px-5 py-2.5 rounded-xl bg-[#844AFB] text-white font-bold text-xs hover:bg-[#6721F2] shadow-md shadow-purple-900/20"
              >
                Browse Competition Kits
              </Link>
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout Button */}
        {items.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Inclusive of GST)</span>
                <PriceTag pricePaise={totals.subtotalPaise} size="sm" />
              </div>
              {totals.discountPaise > 0 && (
                <div className="flex justify-between text-[#844AFB] font-semibold">
                  <span>Coupon Discount</span>
                  <span>- ₹{(totals.discountPaise / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Estimated Shipping</span>
                <span>{totals.isFreeShipping ? 'FREE' : `₹${(totals.shippingPaise / 100).toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <PriceTag pricePaise={totals.totalPaise} size="default" />
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs flex items-center justify-center gap-2 rounded-xl shadow-md shadow-purple-900/20 transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block text-center text-xs text-slate-500 hover:text-slate-900 py-1"
              >
                View Full Cart &amp; Apply Coupon
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
