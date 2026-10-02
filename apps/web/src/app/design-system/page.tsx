import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DesignSystemClient from './_components/design-system-client';

export const metadata: Metadata = {
  title: 'Design System | TTRC Store (Dev Only)',
  robots: { index: false, follow: false },
};

// This page is hidden in production — dev-only showcase.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <DesignSystemClient />;
}
