'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Sparkles, Flame, Clock, ArrowRight } from 'lucide-react';
import { ProductCard, ProductCardProps } from '@/components/store/product-card';
import { Button } from '@/components/ui/button';

interface HomeTabsProps {
  featuredProducts: ProductCardProps[];
  bestSellers: ProductCardProps[];
  newArrivals: ProductCardProps[];
}

export function HomeTabs({ featuredProducts, bestSellers, newArrivals }: HomeTabsProps) {
  const [activeTab, setActiveTab] = React.useState<'featured' | 'bestsellers' | 'new'>('featured');

  const products = React.useMemo(() => {
    switch (activeTab) {
      case 'bestsellers':
        return bestSellers;
      case 'new':
        return newArrivals;
      case 'featured':
      default:
        return featuredProducts;
    }
  }, [activeTab, featuredProducts, bestSellers, newArrivals]);

  return (
    <div className="space-y-5">
      {/* Section header + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#844AFB] uppercase tracking-widest">Products</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('featured')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-[#844AFB] text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-[#EEE8FA] hover:text-[#844AFB]'
              }`}
            >
              <Sparkles size={13} /> Featured
            </button>
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bestsellers'
                  ? 'bg-[#844AFB] text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-[#EEE8FA] hover:text-[#844AFB]'
              }`}
            >
              <Flame size={13} /> Best Sellers
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-[#844AFB] text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-[#EEE8FA] hover:text-[#844AFB]'
              }`}
            >
              <Clock size={13} /> New Arrivals
            </button>
          </div>
        </div>

        <Link
          href="/category/gamified-robots"
          className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] inline-flex items-center gap-1 group self-end"
          aria-label="View all products"
        >
          <span>View All</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Product Grid or Empty State */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      ) : (
        <div className="p-12 sm:p-16 text-center rounded-2xl bg-[#EEE8FA]/40 border border-purple-100 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-purple-200 shadow-sm flex items-center justify-center mx-auto text-[#844AFB]">
            <Package size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading text-lg font-bold text-slate-900">
              No products published in this collection yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Products will appear here once published through the admin panel.
              Explore our categories or contact us for custom robotics sourcing.
            </p>
          </div>
          <Link href="/bulk-enquiry">
            <Button
              variant="outline"
              size="sm"
              className="border-purple-200 text-[#1E0D45] hover:bg-white text-xs font-bold rounded-xl mt-2"
            >
              Request Custom Sourcing
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
