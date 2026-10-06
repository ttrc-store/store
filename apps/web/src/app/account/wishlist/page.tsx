'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/store/price-tag';
import { getWishlistAction, removeFromWishlistAction } from '@/actions/account';
import { useCartStore } from '@/store/use-cart';

export default function AccountWishlistPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const addItem = useCartStore((state) => state.addItem);

  const loadWishlist = React.useCallback(async () => {
    setLoading(true);
    const res = await getWishlistAction();
    if ('wishlistItems' in res) {
      setItems(res.wishlistItems ?? []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId: string) => {
    await removeFromWishlistAction(productId);
    await loadWishlist();
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.productId,
      slug: product.slug,
      name: product.name,
      pricePaise: product.pricePaise,
      mrpPaise: product.mrpPaise,
      imageUrl: product.imageUrl,
      quantity: 1,
      gstPercent: 18,
      stockQty: product.stockQty || 10,
      productType: (product.type as 'kit' | 'spare_part' | 'standard') || 'standard',
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="text-[#844AFB]" size={22} />
          My Saved Wishlist
        </h2>
        <p className="text-xs text-slate-500">Products you have saved for future competitions and projects</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading your saved wishlist...</div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.wishlistId}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 relative group hover:border-purple-200 transition-all"
            >
              <div className="relative aspect-square w-full rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform"
                />
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-400 hover:text-red-600 shadow-sm border border-slate-200 transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <Link href={`/product/${item.slug}`} className="font-bold text-xs text-slate-900 hover:text-[#844AFB] line-clamp-2">
                  {item.name}
                </Link>
                <div className="flex items-center gap-2">
                  <PriceTag pricePaise={item.pricePaise} size="sm" />
                  {item.mrpPaise && (
                    <span className="text-[11px] text-slate-400 line-through font-mono">
                      ₹{Math.round(item.mrpPaise / 100)}
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleAddToCart(item)}
                className="w-full bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl h-9"
              >
                <ShoppingBag size={14} className="mr-1.5" />
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-[#844AFB] border border-purple-200 flex items-center justify-center mx-auto">
            <Heart size={24} />
          </div>
          <h3 className="font-heading text-base font-bold text-slate-900">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Explore our robotics kits, sensors, motors, and components and save items for your next build!
          </p>
          <Link href="/categories">
            <Button className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-full shadow-sm mt-2">
              Explore Products
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
