import type { Metadata } from 'next';
import * as React from 'react';

export const metadata: Metadata = {
  title: 'Bulk Orders & Institutional Quotations | TTRC Store',
  description: 'Direct institutional purchase quotations, STEM lab bulk packages, and educational tier pricing from TTRC Store.',
  alternates: {
    canonical: 'https://www.ttrc.store/bulk-orders',
  },
};

export default function BulkOrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
