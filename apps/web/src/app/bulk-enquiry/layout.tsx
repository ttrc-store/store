import type { Metadata } from 'next';
import * as React from 'react';

export const metadata: Metadata = {
  title: 'Bulk & Institutional Enquiries | TTRC Store',
  description: 'Request custom quotations for robotics kits, lab supplies, and bulk component purchases for schools, colleges, and makers.',
  alternates: {
    canonical: 'https://www.ttrc.store/bulk-enquiry',
  },
};

export default function BulkEnquiryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
