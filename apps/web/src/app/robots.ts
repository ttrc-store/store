import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('vercel.app')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'https://www.ttrc.store';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/feeds/', '/api/feeds/'],
        disallow: [
          '/admin/',
          '/account/',
          '/cart',
          '/checkout/',
          '/api/admin/',
          '/api/auth/',
          '/api/upload/',
          '/api/invoice/',
          '/api/webhooks/',
          '/design-system/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
