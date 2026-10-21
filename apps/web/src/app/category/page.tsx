import * as React from 'react';
export const revalidate = 60;

import Link from 'next/link';
import { Metadata } from 'next';
import { Package, ArrowRight, Grid } from 'lucide-react';
import { getStoreCategories } from '@/lib/mongodb/catalog';
import { CategoryCard } from '@/components/store/category-card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'All Categories — Robotics & Engineering Hardware | TTRC Store',
  description:
    'Browse the full catalog of robotics kits, precision motors, sensors, fasteners, batteries, and STEM components at TTRC Store.',
  alternates: {
    canonical: 'https://www.ttrc.store/category',
  },
};

export default async function AllCategoriesPage() {
  const categories = await getStoreCategories();

  const breadcrumbs = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Categories', url: 'https://www.ttrc.store/category' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>All Categories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="relative rounded-2xl p-6 sm:p-10 overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border border-purple-900 shadow-xl text-white">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Grid size={14} /> TTRC Catalog Directory
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Browse All Categories
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              From competition robot platforms and precision motors to engineering fasteners and
              high-discharge LiPo batteries — explore our verified hardware lines.
            </p>
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                slug={cat.slug}
                name={cat.name}
                description={cat.description}
                itemCount={cat.productCount}
                imageUrl={cat.imageUrl}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
            <Package size={44} className="mx-auto text-purple-400" />
            <h3 className="font-heading font-bold text-slate-900 text-lg">No Categories Configured</h3>
            <p className="text-xs text-slate-500">Categories will appear here once published by the store administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
}
