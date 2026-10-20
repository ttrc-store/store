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
  ShieldCheck,
  Ticket,
  BarChart3,
  Store,
  ExternalLink,
  Menu,
  X,
  Search,
  Bell,
  UserCheck,
  MessageSquareQuote,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Enquiries & RFQ', href: '/admin/enquiries', icon: MessageSquareQuote },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Store Settings', href: '/admin/settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-slate-900 flex flex-col md:flex-row">
      {/* ─── DESKTOP PERSISTENT SIDEBAR ─── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between h-screen sticky top-0 shadow-sm shrink-0">
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
            <span className="text-[10px] font-bold text-[#844AFB] bg-[#EEE8FA] px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
              <ShieldCheck size={12} /> ADMIN
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1" aria-label="Admin desktop navigation">
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
                      ? 'bg-[#844AFB] text-white shadow-sm shadow-purple-900/20'
                      : 'text-slate-600 hover:text-[#844AFB] hover:bg-[#EEE8FA]/70'
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
            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-[#EEE8FA] text-xs font-bold text-slate-700 hover:text-[#844AFB] transition-all border border-slate-200 hover:border-purple-200 group"
            title="Open live Storefront in new tab"
          >
            <span className="flex items-center gap-2">
              <Store size={15} className="text-[#844AFB]" />
              <span>Storefront</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 group-hover:text-[#844AFB]">
              <span>Live</span>
              <ExternalLink size={13} />
            </span>
          </a>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER OVERLAY ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── MOBILE SLIDE-OUT DRAWER ─── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin mobile navigation menu"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
              <Image
                src="/brand/ttrc-logo.png"
                alt="TTRC Store"
                width={110}
                height={30}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close admin menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Links */}
          <nav className="p-3 space-y-1" aria-label="Admin mobile navigation">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-[#844AFB] text-white shadow-sm shadow-purple-900/20'
                      : 'text-slate-700 hover:text-[#844AFB] hover:bg-[#EEE8FA]/70'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 pb-safe">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-50 hover:bg-[#EEE8FA] text-xs font-bold text-slate-700 hover:text-[#844AFB] transition-all border border-slate-200 min-h-[44px]"
          >
            <span className="flex items-center gap-2">
              <Store size={16} className="text-[#844AFB]" />
              <span>Live Storefront</span>
            </span>
            <ExternalLink size={14} className="text-slate-400" />
          </a>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Responsive Admin Header with Hamburger Menu */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open admin navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Search Input — fluid & compact */}
            <div className="relative w-full max-w-[200px] sm:max-w-xs md:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search products, orders..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#844AFB]"
              />
            </div>
          </div>

          {/* Admin Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#EEE8FA] text-slate-700 hover:text-[#844AFB] text-xs font-bold border border-slate-200 hover:border-purple-200 transition-colors shadow-2xs"
              title="Open live storefront in new tab"
            >
              <Store size={14} className="text-[#844AFB]" />
              <span>Storefront</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>

            <button
              type="button"
              className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="Admin notifications"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-[#844AFB] shrink-0">
                <UserCheck size={16} />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">Tamizh Tech Admin</p>
                <p className="text-[10px] text-emerald-700 font-mono">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
