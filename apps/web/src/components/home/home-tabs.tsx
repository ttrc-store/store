'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Sparkles, Flame, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, ProductCardProps } from '@/components/store/product-card';
import { Button } from '@/components/ui/button';

interface HomeTabsProps {
  featuredProducts: ProductCardProps[];
  bestSellers: ProductCardProps[];
  newArrivals: ProductCardProps[];
}

const ITEMS_PER_PAGE = 8;

export function HomeTabs({ featuredProducts, bestSellers, newArrivals }: HomeTabsProps) {
  const [activeTab, setActiveTab] = React.useState<'featured' | 'bestsellers' | 'new'>('featured');
  const [currentPage, setCurrentPage] = React.useState<number>(0);

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

  // Reset to first page whenever tab changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const startIndex = safePage * ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="space-y-5">
      {/* Section header + tabs + right/left arrows */}
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

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-sm">
              <button
                onClick={handlePrev}
                disabled={safePage === 0}
                aria-label="Previous products"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white hover:text-[#844AFB] hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-600 px-2 select-none">
                {safePage + 1} / {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={safePage >= totalPages - 1}
                aria-label="Next products"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white hover:text-[#844AFB] hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <Link
            href="/category"
            className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] inline-flex items-center gap-1 group py-2"
            aria-label="View all products"
          >
            <span>View All</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {currentProducts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Bottom pagination controls when multiple pages exist */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handlePrev}
                disabled={safePage === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-[#EEE8FA] hover:text-[#844AFB] hover:border-purple-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      safePage === idx
                        ? 'bg-[#844AFB] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={safePage >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-[#EEE8FA] hover:text-[#844AFB] hover:border-purple-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
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
