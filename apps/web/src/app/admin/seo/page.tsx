import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { getAdminSeoAuditAction } from '@/actions/seo';
import { AdminSeoClient } from './_components/admin-seo-client';

export const metadata: Metadata = {
  title: 'SEO & Search Console Intelligence | TTRC Store Admin',
  description: 'AI-assisted SEO, AEO, and Google Search Console performance hub for TTRC Store.',
};

export default async function AdminSeoPage() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect('/admin/login');
  }

  const res = await getAdminSeoAuditAction();
  const initialAudit = res.data || {
    totalProducts: 0,
    publishedProducts: 0,
    productsWithPrimaryKeyword: 0,
    productsWithFaqs: 0,
    productsHighReadiness: 0,
    averageReadinessScore: 0,
    lowScoreProducts: [],
    categoriesCount: 0,
    sitemapUrl: 'https://www.ttrc.store/sitemap.xml',
    robotsUrl: 'https://www.ttrc.store/robots.txt',
    canonicalDomain: 'https://www.ttrc.store',
    gscConfigured: false,
    gscProperty: 'sc-domain:ttrc.store',
  };

  return (
    <div className="py-6">
      <AdminSeoClient initialAudit={initialAudit} />
    </div>
  );
}
