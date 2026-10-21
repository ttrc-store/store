'use server';

import { requireAdmin } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { ProductModel, CategoryModel } from '@/lib/mongodb/models';

export interface SeoCatalogAudit {
  totalProducts: number;
  publishedProducts: number;
  productsWithPrimaryKeyword: number;
  productsWithFaqs: number;
  productsHighReadiness: number;
  averageReadinessScore: number;
  lowScoreProducts: Array<{
    id: string;
    name: string;
    slug: string;
    score: number;
    primaryKeyword?: string;
    missingSpecsCount: number;
  }>;
  categoriesCount: number;
  sitemapUrl: string;
  robotsUrl: string;
  canonicalDomain: string;
  gscConfigured: boolean;
  gscProperty: string;
}

export async function getAdminSeoAuditAction(): Promise<{ data?: SeoCatalogAudit; error?: string }> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const [products, categoriesCount] = await Promise.all([
      ProductModel.find({}, {
        _id: 1,
        name: 1,
        slug: 1,
        status: 1,
        primary_keyword: 1,
        secondary_keywords: 1,
        search_questions: 1,
        seo_readiness_score: 1,
        technical_specs: 1,
      }).lean(),
      CategoryModel.countDocuments(),
    ]);

    const totalProducts = products.length;
    const publishedProducts = products.filter((p) => p.status === 'published').length;
    const productsWithPrimaryKeyword = products.filter((p) => Boolean(p.primary_keyword)).length;
    const productsWithFaqs = products.filter(
      (p) => Array.isArray(p.search_questions) && p.search_questions.length > 0
    ).length;

    let totalScore = 0;
    let productsWithScore = 0;
    const lowScoreProducts: SeoCatalogAudit['lowScoreProducts'] = [];

    for (const p of products) {
      const score = p.seo_readiness_score ?? (p.primary_keyword ? 60 : 30);
      totalScore += score;
      productsWithScore++;

      if (score < 75 && lowScoreProducts.length < 15) {
        lowScoreProducts.push({
          id: p._id.toString(),
          name: p.name,
          slug: p.slug,
          score,
          primaryKeyword: p.primary_keyword,
          missingSpecsCount: Math.max(0, 3 - (p.technical_specs?.length || 0)),
        });
      }
    }

    const averageReadinessScore = productsWithScore > 0 ? Math.round(totalScore / productsWithScore) : 0;
    const highReadiness = products.filter((p) => (p.seo_readiness_score ?? 0) >= 80).length;

    const gscConfigured = Boolean(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL &&
      process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY
    ) || Boolean(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID &&
      process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ttrc.store';

    return {
      data: {
        totalProducts,
        publishedProducts,
        productsWithPrimaryKeyword,
        productsWithFaqs,
        productsHighReadiness: highReadiness,
        averageReadinessScore,
        lowScoreProducts,
        categoriesCount,
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        robotsUrl: `${baseUrl}/robots.txt`,
        canonicalDomain: 'https://www.ttrc.store',
        gscConfigured,
        gscProperty: 'sc-domain:ttrc.store',
      },
    };
  } catch (err: any) {
    console.error('[SEO Action Error]', err);
    return { error: err.message || 'Failed to load SEO audit data' };
  }
}
