import * as React from 'react';
import { headers } from 'next/headers';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { StorefrontFloating } from './storefront-floating';
import { StorefrontClientShell } from './storefront-client-shell';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { getStoreCategories } from '@/lib/mongodb/catalog';

// SERVER COMPONENT — prepares authenticated session & dynamic categories,
// while StorefrontClientShell dynamically manages visibility across admin/storefront route transitions.
export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('next-url') || '';
  const initialIsAdmin = pathname.startsWith('/admin');

  const auth = await getAuthenticatedUser();
  const user = 'user' in auth ? auth.user : null;

  // Dynamically load active categories containing products assigned by admin
  let activeCategories: Array<{ href: string; label: string; slug: string; productCount: number }> = [];
  try {
    const storeCategories = await getStoreCategories();
    activeCategories = storeCategories
      .filter((c) => !c.parentId && c.productCount > 0)
      .map((c) => ({
        href: `/category/${c.slug}`,
        label: c.name,
        slug: c.slug,
        productCount: c.productCount,
      }));
  } catch (err) {
    console.error('[StorefrontShell] Failed to load dynamic header categories:', err);
  }

  return (
    <StorefrontClientShell
      initialIsAdmin={initialIsAdmin}
      header={<Header user={user} categories={activeCategories.length > 0 ? activeCategories : undefined} />}
      footer={<Footer />}
      floating={<StorefrontFloating />}
    >
      {children}
    </StorefrontClientShell>
  );
}

