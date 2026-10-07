import * as React from 'react';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SlidersHorizontal, Package, Cpu, Bot, ChevronRight } from 'lucide-react';
import { getStoreProducts, toStoreProductCardProps } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { CategoryModel } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/client';
import { CATEGORIES } from '@/components/layout/mega-menu';

interface SubcategoryPageProps {
  params: Promise<{ slug: string; subslug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: SubcategoryPageProps): Promise<Metadata> {
  const { slug, subslug } = await params;
  await connectToDatabase();

  const subCat = await CategoryModel.findOne({ slug: subslug }).lean();
  const parentCat = await CategoryModel.findOne({ slug }).lean();

  const subName = subCat?.name || (subslug === 'line-follower' ? 'Line Follower Robot (LFR)' : subslug);
  const parentName = parentCat?.name || (slug === 'gamified-robots' ? 'Gamified Robots' : slug);

  return {
    title: `${subName} — ${parentName} Kits & Spares | TTRC Store`,
    description: `Shop official ${subName} competition platforms, carrier boards, Arduino Nano controllers, sensor arrays, and replacement spares at Tamizh Tech Store. 100% genuine with pan-India delivery.`,
    alternates: {
      canonical: `https://ttrc.store/category/${slug}/${subslug}`,
    },
  };
}

export default async function SubcategoryPage({ params, searchParams }: SubcategoryPageProps) {
  const { slug, subslug } = await params;
  const resolvedParams = await searchParams;

  const typeFilter = typeof resolvedParams.type === 'string' ? resolvedParams.type : 'all';
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'featured';

  await connectToDatabase();
  const [parentCat, subCat] = await Promise.all([
    CategoryModel.findOne({ slug }).lean(),
    CategoryModel.findOne({ slug: subslug }).lean(),
  ]);

  // Fallback to static tree if not found in db
  const parentName =
    parentCat?.name ||
    CATEGORIES.find((c) => c.slug === slug)?.name ||
    (slug === 'gamified-robots' ? 'Gamified Robots' : slug);

  const subName =
    subCat?.name ||
    (subslug === 'line-follower' ? 'Line Follower Robot (LFR)' : subslug.replace(/-/g, ' '));

  const subDescription =
    subCat?.description ||
    (subslug === 'line-follower'
      ? 'High-performance Line Follower Robot (LFR) competition platforms, carrier boards, 7-array optical line sensors, and replacement spare parts.'
      : `Official ${subName} components, kits, and replacement parts tested for competition robotics.`);

  // Query products for this subcategory
  const { products } = await getStoreProducts({
    categorySlug: slug,
    subcategorySlug: subslug,
    productType: typeFilter,
    sort,
    limit: 60,
  });

  const isLfr = subslug === 'line-follower';

  const breadcrumbItems = [
    { name: 'Home', url: 'https://ttrc.store' },
    { name: parentName, url: `https://ttrc.store/category/${slug}` },
    { name: subName, url: `https://ttrc.store/category/${slug}/${subslug}` },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Header */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/category/${slug}`}>{parentName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header Banner */}
        <div className="relative rounded-2xl p-6 sm:p-10 mb-8 overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border border-purple-900 shadow-xl text-white">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Bot size={13} className="mr-1" />
                {parentName}
              </span>
              {isLfr && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  LFR = Line Follower Robot
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {subName}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {subDescription}
            </p>
          </div>
        </div>

        {/* Kits vs Spare Parts Tabs for Competition Robotics (AGENTS.md Requirement) */}
        <div className="flex border-b border-purple-100 mb-8 overflow-x-auto">
          <Link
            href={`/category/${slug}/${subslug}`}
            className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
              typeFilter === 'all'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-950'
            }`}
          >
            All Items
          </Link>
          <Link
            href={`/category/${slug}/${subslug}?type=kit`}
            className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              typeFilter === 'kit'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-950'
            }`}
          >
            <Package size={16} />
            Complete Kits
          </Link>
          <Link
            href={`/category/${slug}/${subslug}?type=spare_part`}
            className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              typeFilter === 'spare_part'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-950'
            }`}
          >
            <Cpu size={16} />
            Spare Parts
          </Link>
        </div>

        {/* Content Layout: Filters + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="p-5 rounded-2xl border border-purple-100 bg-purple-50/20 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <span className="font-heading text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal size={16} className="text-purple-700" />
                  Filter Catalog
                </span>
                <Link
                  href={`/category/${slug}/${subslug}`}
                  className="text-xs text-purple-700 hover:underline font-semibold"
                >
                  Reset
                </Link>
              </div>

              {/* Product Type Filter */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Product Type</h4>
                <div className="space-y-2 text-xs">
                  <Link
                    href={`/category/${slug}/${subslug}`}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg transition-colors ${
                      typeFilter === 'all'
                        ? 'bg-purple-100/70 text-purple-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Items</span>
                    <span className="text-[11px] text-slate-400">({products.length})</span>
                  </Link>
                  <Link
                    href={`/category/${slug}/${subslug}?type=kit`}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg transition-colors ${
                      typeFilter === 'kit'
                        ? 'bg-purple-100/70 text-purple-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Complete Kits</span>
                    <Package size={14} className="text-purple-700" />
                  </Link>
                  <Link
                    href={`/category/${slug}/${subslug}?type=spare_part`}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg transition-colors ${
                      typeFilter === 'spare_part'
                        ? 'bg-purple-100/70 text-purple-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Spare Parts</span>
                    <Cpu size={14} className="text-purple-700" />
                  </Link>
                </div>
              </div>

              {/* Verified Maker Guarantee */}
              <div className="pt-4 border-t border-purple-100 text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-800">100% Genuine Robotics</p>
                <p>All kits and modules are bench-tested by Tamizh Tech engineers prior to dispatch.</p>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-50/40 border border-purple-100">
              <p className="text-xs text-slate-600">
                Showing <strong className="text-slate-900">{products.length}</strong> products in{' '}
                <span className="text-purple-700 font-bold">{subName}</span>
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Sort by:</span>
                <select
                  defaultValue={sort}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="featured">Featured / Recommended</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...toStoreProductCardProps(product)} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-purple-50/30 border border-purple-100 space-y-4">
                <Package size={48} className="mx-auto text-purple-300" />
                <h3 className="font-heading text-lg font-bold text-slate-900">No products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no products currently matching the selected filters.
                </p>
                <Link
                  href={`/category/${slug}/${subslug}`}
                  className="inline-block px-5 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors shadow-sm"
                >
                  Clear Filters
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
