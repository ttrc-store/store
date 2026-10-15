'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MapPin, Heart, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Overview', href: '/account', icon: LayoutDashboard },
  { label: 'My Orders', href: '/account/orders', icon: Package },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'My Reviews', href: '/account/reviews', icon: Star },
  { label: 'Privacy & Data (DPDP)', href: '/account/privacy', icon: ShieldCheck },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account navigation"
      className="p-2 sm:p-2.5 lg:p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 scrollbar-none whitespace-nowrap"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/account'
            ? pathname === '/account'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[44px]',
              isActive
                ? 'bg-purple-50 text-[#844AFB] border border-purple-200 shadow-xs font-extrabold'
                : 'text-slate-700 hover:text-[#844AFB] hover:bg-purple-50/50'
            )}
          >
            <Icon size={16} className={cn(isActive ? 'text-[#844AFB]' : 'text-slate-500')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
