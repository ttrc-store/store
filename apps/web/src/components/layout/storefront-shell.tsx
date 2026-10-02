import * as React from 'react';
import { headers } from 'next/headers';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { StorefrontFloating } from '@/components/layout/storefront-floating';

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
    <>
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <StorefrontFloating />
    </>
  );
}
