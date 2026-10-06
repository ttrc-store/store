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
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
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
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
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
                    ? 'bg-[#844AFB] text-white shadow-md shadow-purple-900/20'
                    : 'text-slate-600 hover:text-[#6721F2] hover:bg-[#EEE8FA]/60'
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
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors border border-slate-200"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft size={14} /> Storefront
          </span>
          <ExternalLink size={14} className="text-slate-400" />
        </Link>
      </div>
    </aside>
  );
}
