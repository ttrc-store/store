import type { MetadataRoute } from 'next';
import { CATALOG_PRODUCTS } from '@/lib/catalog-data';
import { CATEGORY_TREE } from '@ttrc/shared';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ttrc.store';

export default function sitemap(): MetadataRoute.Sitemap {
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
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_TREE.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const productPages: MetadataRoute.Sitemap = CATALOG_PRODUCTS.map((prod) => ({
    url: `${BASE_URL}/product/${prod.slug}`,
    lastModified: new Date(prod.updatedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
