'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Settings,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Ticket,
  BarChart3,
  Store,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Store Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shadow-sm">
      <div>
        {/* Brand Logo Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="relative flex items-center justify-center p-1">
              <Image
                src="/brand/ttrc-logo.png"
                alt="TTRC Store"
                width={120}
                height={34}
                priority
                className="h-8 w-auto object-contain"
              />
            </div>
          </Link>
          <span className="text-[10px] font-bold text-[#E3132A] bg-[#FDECEE] px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1">
            <ShieldCheck size={12} /> ADMIN
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#E3132A] text-white shadow-sm shadow-red-900/20'
                    : 'text-slate-600 hover:text-[#E3132A] hover:bg-[#FDECEE]/70'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Return Link */}
      <div className="p-4 border-t border-slate-200 space-y-1.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-[#FDECEE] text-xs font-bold text-slate-700 hover:text-[#E3132A] transition-all border border-slate-200 hover:border-red-200 group"
          title="Open live Storefront in new tab"
        >
          <span className="flex items-center gap-2">
            <Store size={15} className="text-[#E3132A]" />
            <span>Storefront</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 group-hover:text-[#E3132A]">
            <span>Live</span>
            <ExternalLink size={13} />
          </span>
        </a>
      </div>
    </aside>
  );
}
