import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#4C1D95' },
    { media: '(prefers-color-scheme: light)', color: '#6D28D9' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ttrc.store'),
  title: {
    default: 'TTRC Store – Robotics, STEM Kits & Electronics | Tamizh Tech',
    template: '%s | TTRC Store',
  },
  description:
    'Official online store of Tamizh Tech (tamizhtech.in). High-quality robotics kits, STEM components, motors, sensors, LiPo batteries and fasteners with India-wide delivery and GST invoices.',
  keywords: [
    'robotics store India',
    'STEM kits',
    'robo race kit',
    'line follower robot',
    'sensors India',
    'lipo battery India',
    'N20 motor',
    'tamizh tech',
    'coimbatore robotics',
  ],
  authors: [{ name: 'Tamizh Tech', url: 'https://tamizhtech.in' }],
  creator: 'Tamizh Tech',
  publisher: 'Tamizh Tech',
  icons: {
    icon: [
      { url: '/brand/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/brand/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'TTRC Store – Robotics & Electronics India',
    description: 'High-quality robotics kits and spare parts with fast India-wide delivery. GST invoices included.',
    url: 'https://ttrc.store',
    siteName: 'TTRC Store',
    images: [
      {
        url: '/brand/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TTRC Store – Robotics, STEM Kits & Electronics',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TTRC Store – Robotics & Electronics India',
    description: 'High-quality robotics kits and spare parts with fast India-wide delivery.',
    images: ['/brand/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { StorefrontShell } from '@/components/layout/storefront-shell';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <StorefrontShell>{children}</StorefrontShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
