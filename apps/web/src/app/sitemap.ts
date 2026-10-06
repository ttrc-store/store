import type { MetadataRoute } from 'next';

export const revalidate = 3600; // Edge cached for 1 hour; revalidated in background

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ttrc.store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/bulk-enquiry`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    const { getStoreCategories, getStoreProducts } = await import('@/lib/mongodb/catalog');

    const categories = await getStoreCategories();
    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    const { products } = await getStoreProducts({ limit: 500 });
    const productPages: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${BASE_URL}/product/${prod.slug}`,
      lastModified: new Date(prod.updatedAt),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (err) {
    console.warn('[Sitemap] DB unavailable at build time — returning static pages only:', err);
    return staticPages;
  }
}
