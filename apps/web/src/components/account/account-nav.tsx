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
    <nav className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
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
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all',
              isActive
                ? 'bg-purple-50 text-[#844AFB] border border-purple-200 shadow-xs'
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
