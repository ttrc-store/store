'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, ChevronDown, Truck, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MegaMenu } from './mega-menu';
import { PriceTag } from '@/components/store/price-tag';
import { useCartStore } from '@/store/use-cart';
import { cn } from '@/lib/utils';

interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  pricePaise: number;
  imageUrl: string;
  type: string;
  stockQty: number;
}

export default function Header() {
  const router = useRouter();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const { items, openDrawer } = useCartStore();
  const totalCartQty = items.reduce((acc, i) => acc + i.quantity, 0);

  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch (err) {
        console.error('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDFDFD] border-b border-slate-200 shadow-sm text-[#050507]">
      {/* Utility Bar — desktop only */}
      <div className="hidden md:flex bg-[#1E0D45] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 justify-between items-center">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-medium">
            <Truck size={12} className="text-[#AF87F8]" />
            Free delivery on orders above ₹999
          </span>
          <span className="text-purple-900">·</span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={12} className="text-[#AF87F8]" />
            Official Tamizh Tech Store
          </span>
        </div>
        <div className="flex items-center gap-5 font-medium">
          <Link href="/bulk-enquiry" className="hover:text-white transition-colors">Institutional Orders</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          <span className="font-bold text-white bg-[#844AFB] px-2 py-0.5 rounded text-[10px] font-mono">INR ₹</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo Container (NO BACKGROUND COLOR - Clean Seamless Integration) */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="TTRC Store Home">
          <div className="relative p-1">
            <Image
              src="/brand/ttrc-logo.png"
              alt="TTRC Store Logo"
              width={140}
              height={40}
              priority
              className="object-contain"
            />
          </div>
        </Link>

        {/* Categories Mega Menu Trigger Button */}
        <div className="relative hidden md:block" onMouseEnter={() => setIsMegaMenuOpen(true)}>
          <button
            type="button"
            onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EEE8FA] border border-[#AF87F8]/30 text-xs font-bold text-[#1E0D45] hover:border-[#844AFB] hover:bg-[#EEE8FA] hover:text-[#6721F2] transition-all cursor-pointer"
          >
            <Menu size={16} className="text-[#6721F2]" />
            <span>Shop By Category</span>
            <ChevronDown size={14} className={cn('transition-transform text-[#6D6A6A]', isMegaMenuOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="flex-1 max-w-2xl relative hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6D6A6A] w-4 h-4" />
            <Input
              type="search"
              placeholder="Search robotics, electronics, automation & more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              aria-label="Search products"
              className="pl-11 pr-28 h-12 bg-white border-slate-300 text-[#050507] placeholder:text-[#6D6A6A] rounded-xl focus:ring-2 focus:ring-[#844AFB] focus:border-[#844AFB] text-sm font-medium shadow-inner"
            />
            <Button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Search
            </Button>
          </form>

          {/* Search Live Suggestions Drawer */}
          {isSearchFocused && searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#AF87F8]/40 rounded-xl shadow-2xl overflow-hidden z-50 text-[#050507]">
              <div className="p-3 text-xs font-bold text-[#1E0D45] uppercase tracking-wider border-b border-[#EEE8FA] flex justify-between items-center bg-[#EEE8FA]">
                <span>Products Matching &quot;{searchQuery}&quot;</span>
                <span className="text-[10px] text-[#6721F2] font-normal">Press Enter to search all</span>
              </div>
              <div className="divide-y divide-[#EEE8FA] max-h-80 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-[#EEE8FA] transition-colors"
                    >
                      <div className="relative w-10 h-10 rounded-lg bg-[#EEE8FA]/60 border border-[#AF87F8]/30 flex-shrink-0 overflow-hidden">
                        <Image src={item.imageUrl || '/brand/ttrc-logo.png'} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#050507] line-clamp-1">{item.name}</p>
                        <span className="text-[10px] font-bold text-[#6721F2] bg-[#EEE8FA] px-1.5 py-0.5 rounded border border-[#AF87F8]/40">
                          {item.type === 'kit' ? 'Robot Kit' : item.type === 'spare_part' ? 'Spare Part' : 'Component'}
                        </span>
                      </div>
                      <PriceTag pricePaise={item.pricePaise} size="sm" />
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-sm text-[#6D6A6A] text-center">No products found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <Link href="/account/wishlist" className="hidden sm:inline-block">
            <Button variant="ghost" size="icon" className="text-[#1E0D45] hover:text-[#844AFB] hover:bg-[#EEE8FA] rounded-xl">
              <Heart size={18} />
            </Button>
          </Link>

          {/* Account Icon */}
          <Link href="/account" className="hidden sm:inline-block">
            <Button variant="ghost" size="icon" className="text-[#1E0D45] hover:text-[#844AFB] hover:bg-[#EEE8FA] rounded-xl">
              <User size={18} />
            </Button>
          </Link>

          {/* Cart Icon with Drawer Trigger */}
          <Button
            onClick={openDrawer}
            className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold h-9 sm:h-10 px-3 sm:px-4 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-md shadow-purple-900/20 text-xs glow-purple-sm"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {totalCartQty > 0 && (
              <span className="bg-white text-[#6721F2] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartQty}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Live Search Bar */}
      <div className="sm:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6D6A6A] w-4 h-4" />
          <Input
            type="text"
            placeholder="Search robotics kits, motors, sensors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-20 h-10 bg-white border-slate-200 text-[#050507] placeholder:text-[#6D6A6A] rounded-xl text-xs font-medium w-full focus:ring-2 focus:ring-[#844AFB]"
          />
          <Button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-lg shadow-xs"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Category Navigation Subbar */}
      <div className="bg-white border-t border-slate-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-9 text-xs font-semibold text-[#1E0D45] overflow-x-auto scrollbar-hide">
          <nav className="flex items-center gap-1 flex-1" aria-label="Product categories">
            {[
              { href: '/category/gamified-robots', label: 'Gamified Robots' },
              { href: '/category/stem-kits', label: 'STEM Kits' },
              { href: '/category/fasteners', label: 'Fasteners' },
              { href: '/category/batteries', label: 'Batteries & Power' },
              { href: '/category/motors', label: 'Motors & Drivers' },
              { href: '/category/sensors', label: 'Sensors' },
              { href: '/category/drones', label: 'Drones' },
              { href: '/category/wires-connectors', label: 'Wires & Connectors' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-2 hover:text-[#844AFB] hover:bg-[#EEE8FA]/60 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/bulk-enquiry" className="ml-4 text-[#6721F2] hover:text-[#844AFB] font-bold flex items-center gap-1 whitespace-nowrap text-[11px] flex-shrink-0">
            Bulk / Institutional Orders →
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
