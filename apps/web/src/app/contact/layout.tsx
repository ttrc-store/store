import type { Metadata } from 'next';
import * as React from 'react';

export const metadata: Metadata = {
  title: 'Contact Us | Customer Support & Technical Enquiries | TTRC Store',
  description: 'Get in touch with Tamizh Tech & TTRC Store for order assistance, technical queries, or school partnerships.',
  alternates: {
    canonical: 'https://www.ttrc.store/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
