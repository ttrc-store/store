'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/use-cart';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Categories', href: '/category/gamified-robots', icon: Grid },
    { label: 'Cart', href: '/cart', icon: ShoppingBag, badge: cartCount },
    { label: 'Profile', href: '/account', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 flex items-center justify-around px-2 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full text-xs font-semibold transition-colors relative',
              isActive ? 'text-purple-700' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <div className="relative">
              <Icon size={20} className={cn(isActive && 'scale-110 transition-transform')} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-purple-700 text-white text-[10px] font-extrabold font-mono shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
