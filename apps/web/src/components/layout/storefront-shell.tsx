import * as React from 'react';
import { headers } from 'next/headers';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { StorefrontFloating } from './storefront-floating';

// SERVER COMPONENT — no 'use client' here.
// Only the interactive floating elements (WhatsApp btn, Cookie banner, Mobile nav)
// are deferred to a tiny client boundary via StorefrontFloating.
export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('next-url') || '';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FDFDFD]">
      {/* Centralized subtle ambient gradient */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 bg-[#FDFDFD] [background:radial-gradient(120%_120%_at_50%_0%,#FDFDFD_50%,#EEE8FA_100%)] opacity-80"
      />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <StorefrontFloating />
    </div>
  );
}
