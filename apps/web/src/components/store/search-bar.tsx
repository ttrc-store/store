'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Loader2, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PriceDisplay } from './price-display';
import { cn } from '@/lib/utils';

export interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  pricePaise: number;
  imageUrl: string;
  type: string;
  stockQty: number;
}

export interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSelect?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search robots, motors, sensors, batteries, screws...',
  className,
  onSelect,
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search query
  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      const timer = setTimeout(() => {
        setResults([]);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      router.push(`/product/${results[selectedIndex].slug}`);
      setIsOpen(false);
      onSelect?.();
      return;
    }

    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      onSelect?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-10 sm:h-11 w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white pl-10 pr-10 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#844AFB] focus:ring-2 focus:ring-[#844AFB]/20 transition-all text-[#050507]"
        />
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        {isLoading ? (
          <Loader2
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#844AFB] animate-spin"
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X size={14} />
          </button>
        ) : null}
      </form>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (results.length > 0 || query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
          {results.length > 0 ? (
            <div className="py-2 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Products Matching &quot;{query}&quot;</span>
                <span>{results.length} results</span>
              </div>
              {results.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  onClick={() => {
                    setIsOpen(false);
                    onSelect?.();
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 transition-colors',
                    selectedIndex === idx ? 'bg-[#EEE8FA]/60' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="size-11 rounded-lg bg-slate-50 border border-slate-100 relative shrink-0 overflow-hidden flex items-center justify-center p-1">
                    <Image
                      src={item.imageUrl || '/brand/ttrc-logo.png'}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                      sizes="44px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PriceDisplay pricePaise={item.pricePaise} size="sm" showDiscountBadge={false} />
                      {item.brand && (
                        <span className="text-[10px] text-slate-500 font-medium">by {item.brand}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                </Link>
              ))}
              <div className="p-2 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-2 text-center text-xs font-bold text-[#844AFB] hover:text-[#6721F2] hover:underline"
                >
                  See all results for &quot;{query}&quot; <ArrowRight size={12} className="inline ml-1" />
                </button>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching products found for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
