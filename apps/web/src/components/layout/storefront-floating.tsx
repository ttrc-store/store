'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

// Lazy-load non-critical interactive widgets — they don't need to be in the initial bundle
const MobileBottomNav = dynamic(() => import('@/components/layout/mobile-bottom-nav'), {
  ssr: false,
});
const CookieBanner = dynamic(
  () => import('@/components/layout/cookie-banner').then((m) => ({ default: m.CookieBanner })),
  { ssr: false }
);
const WhatsAppButton = dynamic(
  () => import('@/components/layout/whatsapp-button').then((m) => ({ default: m.WhatsAppButton })),
  { ssr: false }
);
const CartDrawer = dynamic(
  () => import('@/components/cart/cart-drawer').then((m) => ({ default: m.CartDrawer })),
  { ssr: false }
);

// Floating interactive elements that don't affect SSR output
export function StorefrontFloating() {
  return (
    <>
      <MobileBottomNav />
      <CookieBanner />
      <WhatsAppButton />
      <CartDrawer />
    </>
  );
}
