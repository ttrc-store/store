'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, ChevronDown, Sparkles, Truck, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './theme-toggle';
import { MegaMenu } from './mega-menu';
import { CATALOG_PRODUCTS } from '@/lib/catalog-data';
import { PriceTag } from '@/components/store/price-tag';
import { useCartStore } from '@/store/use-cart';
import { cn } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const { items, openDrawer } = useCartStore();
  const totalCartQty = items.reduce((acc, i) => acc + i.quantity, 0);

  // Live catalog search matching
  const suggestions = CATALOG_PRODUCTS.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.slug.includes(searchQuery.toLowerCase()) ||
    item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm text-slate-900">
      {/* Top Utility Bar (Dark Slate Bar for Logo Compatibility & Sleek Readability) */}
      <div className="bg-[#0B132B] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Truck size={13} className="text-red-400" /> Free Dispatch on Orders Above ₹999 across India</span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:flex items-center gap-1"><ShieldCheck size={13} className="text-red-400" /> Official Tamizh Tech Store</span>
        </div>
        <div className="flex items-center gap-5 font-medium">
          <Link href="/bulk-enquiry" className="hover:text-white transition-colors">Bulk / Institutional Enquiry</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          <span className="font-bold text-white bg-red-600 px-2 py-0.5 rounded text-[10px]">INR (₹)</span>
        </div>
      </div>

      {/* Main Header Row (Clean White Surface) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Brand Logo Container */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative p-2 rounded-xl bg-[#0B132B] border border-slate-800 shadow-sm">
            <Image
              src="/brand/ttrc-logo.png"
              alt="TTRC Store Logo"
              width={130}
              height={36}
              priority
              className="object-contain"
            />
          </div>
        </Link>

        {/* Categories Mega Menu Trigger Button (Desktop) */}
        <div className="relative hidden md:block" onMouseEnter={() => setIsMegaMenuOpen(true)}>
          <button
            type="button"
            onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
          >
            <Menu size={16} className="text-red-600" />
            <span>Shop By Category</span>
            <ChevronDown size={14} className={cn('transition-transform text-slate-500', isMegaMenuOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="flex-1 max-w-xl relative hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search robotics kits, spare parts, electronics, motors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pl-10 pr-24 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 text-xs font-medium"
            />
            <Button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Search
            </Button>
          </form>

          {/* Search Live Suggestions Drawer */}
          {isSearchFocused && searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-red-100 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-900">
              <div className="p-3 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-red-100 flex justify-between items-center bg-red-50">
                <span>Products Matching &quot;{searchQuery}&quot;</span>
                <span className="text-[10px] text-red-600 font-normal">Press Enter to search all</span>
              </div>
              <div className="divide-y divide-red-50 max-h-80 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-red-50 transition-colors"
                    >
                      <div className="relative w-10 h-10 rounded-lg bg-red-50/60 border border-red-100 flex-shrink-0 overflow-hidden">
                        <Image src={item.imageUrls[0] || '/brand/ttrc-logo.png'} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {item.type === 'kit' ? 'Robot Kit' : item.type === 'spare_part' ? 'Spare Part' : 'Component'}
                        </span>
                      </div>
                      <PriceTag pricePaise={item.pricePaise} size="sm" />
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-500 text-center">No products found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link href="/account/wishlist">
            <Button variant="ghost" size="icon" className="text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl">
              <Heart size={18} />
            </Button>
          </Link>

          {/* Account Icon */}
          <Link href="/account">
            <Button variant="ghost" size="icon" className="text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl">
              <User size={18} />
            </Button>
          </Link>

          {/* Cart Icon with Drawer Trigger */}
          <Button
            onClick={openDrawer}
            className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4 rounded-full flex items-center gap-2 shadow-md shadow-red-900/20 text-xs glow-red-sm"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {totalCartQty > 0 && (
              <span className="bg-white text-red-600 text-[11px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalCartQty}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Marketplace Category Navigation Subbar (White background + red hover) */}
      <div className="bg-slate-50 border-t border-slate-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-10 text-xs font-semibold text-slate-700">
          <Link href="/category/gamified-robots" className="hover:text-red-600 transition-colors">Gamified Robots</Link>
          <Link href="/category/stem-kits" className="hover:text-red-600 transition-colors">STEM Kits</Link>
          <Link href="/category/fasteners" className="hover:text-red-600 transition-colors">Fasteners &amp; Screws</Link>
          <Link href="/category/batteries" className="hover:text-red-600 transition-colors">Batteries &amp; Power</Link>
          <Link href="/category/motors" className="hover:text-red-600 transition-colors">Motors &amp; Drivers</Link>
          <Link href="/category/sensors" className="hover:text-red-600 transition-colors">Sensors Array</Link>
          <Link href="/category/drones" className="hover:text-red-600 transition-colors">Drone Parts</Link>
          <Link href="/category/wires-connectors" className="hover:text-red-600 transition-colors">Wires &amp; Connectors</Link>
          <Link href="/bulk-enquiry" className="ml-auto text-red-600 hover:text-red-700 font-bold flex items-center gap-1">
            Institutional Quotes &rarr;
          </Link>
        </div>
      </div>

      {/* MegaMenu Dropdown Drawer */}
      {isMegaMenuOpen && (
        <div onMouseLeave={() => setIsMegaMenuOpen(false)}>
          <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
