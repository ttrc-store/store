import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { StorefrontShell } from '@/components/layout/storefront-shell';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  preload: true,
  weight: ['600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  themeColor: '#844AFB',
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
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/brand/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'TTRC Store – Robotics & Electronics India',
    description:
      'High-quality robotics kits and spare parts with fast India-wide delivery. GST invoices included.',
    url: 'https://ttrc.store',
    siteName: 'TTRC Store',
    images: [{ url: '/brand/og-image.jpg', width: 1200, height: 630, alt: 'TTRC Store' }],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <StorefrontShell>{children}</StorefrontShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
