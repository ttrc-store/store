'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CatalogFilterBarProps {
  totalCount: number;
  currentType?: string;
  currentSort?: string;
  inStockOnly?: boolean;
  minPrice?: string;
  maxPrice?: string;
  availableBrands?: string[];
  currentBrand?: string;
  currentVoltage?: string;
}

export function CatalogFilterBar({
  totalCount,
  currentType = 'all',
  currentSort = 'featured',
  inStockOnly = false,
  minPrice = '',
  maxPrice = '',
  availableBrands = ['Tamizh Tech', 'TTRC Spares', 'TTRC Power'],
  currentBrand = 'all',
  currentVoltage = 'all',
}: CatalogFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPriceInput, setMinPriceInput] = React.useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = React.useState(maxPrice);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // reset page to 1 on filter change
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPriceInput) params.set('minPrice', minPriceInput);
    else params.delete('minPrice');

    if (maxPriceInput) params.set('maxPrice', maxPriceInput);
    else params.delete('maxPrice');

    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push(pathname);
  };

  const hasActiveFilters =
    currentType !== 'all' ||
    currentSort !== 'featured' ||
    inStockOnly ||
    minPrice !== '' ||
    maxPrice !== '' ||
    currentBrand !== 'all';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Toolbar: Count + Sort Selection */}
      <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-purple-50/50 border border-purple-100 shadow-xs">
        <p className="text-xs text-slate-700">
          Showing <strong className="text-slate-900 font-bold">{totalCount}</strong> matching components
        </p>

        <div className="flex items-center gap-2 w-full justify-between">
          <label htmlFor="catalog-sort" className="text-xs font-bold text-slate-600 whitespace-nowrap shrink-0">
            Sort by:
          </label>
          <select
            id="catalog-sort"
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-[#844AFB] focus:border-[#844AFB] shadow-xs cursor-pointer truncate"
          >
            <option value="featured">Featured / Recommended</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Filter Options Panel (Collapsible on mobile) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="flex items-center gap-2 text-left font-heading font-bold text-sm text-slate-900 uppercase tracking-wider cursor-pointer w-full sm:w-auto"
          >
            <SlidersHorizontal size={15} className="text-[#844AFB]" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-100 text-[#844AFB] text-[10px] font-bold">
                Active
              </span>
            )}
            <span className="lg:hidden text-xs text-[#844AFB] font-bold ml-auto sm:ml-2">
              {isMobileOpen ? 'Hide ▲' : 'Show Filters ▼'}
            </span>
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#844AFB] hover:text-[#6721F2] font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            >
              <RotateCcw size={12} />
              Reset All
            </button>
          )}
        </div>

        <div className={`space-y-6 ${!isMobileOpen ? 'hidden lg:block' : 'block'}`}>
          {/* Product Type Radios */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product Type</h4>
            <div className="space-y-2 text-xs">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'kit', label: 'Complete Competition Kits' },
              { id: 'spare_part', label: 'Replacement Spare Parts' },
              { id: 'standard', label: 'Standard Hardware & Sensors' },
            ].map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2.5 text-slate-700 cursor-pointer hover:text-[#844AFB] transition-colors"
              >
                <input
                  type="radio"
                  name="productType"
                  value={t.id}
                  checked={currentType === t.id}
                  onChange={() => updateParam('type', t.id)}
                  className="accent-[#844AFB] w-3.5 h-3.5 cursor-pointer"
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* In-Stock Only Toggle */}
        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer font-bold select-none">
            <span>In Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
              className="accent-[#844AFB] rounded w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Price Range Filter */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Price Range (₹)</h4>
          <form onSubmit={handlePriceApply} className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min ₹"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="h-8 text-xs bg-slate-50 border-slate-200"
              />
              <span className="text-slate-400">–</span>
              <Input
                type="number"
                placeholder="Max ₹"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs border-purple-200 text-[#844AFB] hover:bg-purple-50 font-bold rounded-lg cursor-pointer"
            >
              Apply Price
            </Button>
          </form>
        </div>

        {/* Brand Filter */}
        {availableBrands && availableBrands.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Brand</h4>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer hover:text-[#844AFB]">
                <input
                  type="radio"
                  name="brandFilter"
                  checked={currentBrand === 'all'}
                  onChange={() => updateParam('brand', 'all')}
                  className="accent-[#844AFB]"
                />
                <span>All Brands</span>
              </label>
              {availableBrands.map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-2 text-slate-700 cursor-pointer hover:text-[#844AFB]"
                >
                  <input
                    type="radio"
                    name="brandFilter"
                    checked={currentBrand === b}
                    onChange={() => updateParam('brand', b)}
                    className="accent-[#844AFB]"
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Operating Voltage Technical Spec Filter */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operating Voltage</h4>
          <div className="space-y-1.5 text-xs">
            {[
              { id: 'all', label: 'All Voltages' },
              { id: '3.3V', label: '3.3V Logic' },
              { id: '5V', label: '5V Standard' },
              { id: '7', label: '7–12V DC (Robo Race / LFR)' },
              { id: '12V', label: '12V Power Motors' },
            ].map((v) => (
              <label
                key={v.id}
                className="flex items-center gap-2 text-slate-700 cursor-pointer hover:text-[#844AFB]"
              >
                <input
                  type="radio"
                  name="voltageFilter"
                  checked={currentVoltage === v.id}
                  onChange={() => updateParam('voltage', v.id)}
                  className="accent-[#844AFB]"
                />
                <span>{v.label}</span>
              </label>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
