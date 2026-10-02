import * as React from 'react';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SlidersHorizontal, Package, Cpu } from 'lucide-react';
import { getStoreProducts, toStoreProductCardProps } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { CATEGORY_TREE } from '@ttrc/shared';
import { CategoryModel } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/client';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const dbCat = await CategoryModel.findOne({ slug }).lean();
  const category = dbCat ? { name: dbCat.name, slug: dbCat.slug } : CATEGORY_TREE.find((c) => c.slug === slug);

  if (!category) {
    return { title: 'Category Not Found | TTRC Store' };
  }

  return {
    title: `${category.name} — Robotics & STEM Components | TTRC Store`,
    description: `Buy high quality ${category.name} components, kits, and spare parts online at Tamizh Tech Store. 100% genuine components with GST invoice & fast shipping across India.`,
    alternates: {
      canonical: `https://ttrc.store/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedParams = await searchParams;

  const typeFilter = typeof resolvedParams.type === 'string' ? resolvedParams.type : 'all';
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'featured';

  await connectToDatabase();
  const dbCat = await CategoryModel.findOne({ slug }).lean();
  const category = dbCat ? { name: dbCat.name, slug: dbCat.slug, description: dbCat.description } : CATEGORY_TREE.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Fetch real products from MongoDB
  const { products } = await getStoreProducts({
    categorySlug: slug,
    productType: typeFilter,
    sort,
    limit: 60,
  });

  const breadcrumbItems = [
    { name: 'Home', url: 'https://ttrc.store' },
    { name: 'Categories', url: 'https://ttrc.store/category/gamified-robots' },
    { name: category.name, url: `https://ttrc.store/category/${slug}` },
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
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header Banner */}
        <div className="relative rounded-2xl p-6 sm:p-10 mb-10 overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border border-purple-900 shadow-xl text-white">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Official TTRC Catalogue
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore high-performance {category.name.toLowerCase()} designed for Robo Race, STEM education, and DIY electronics. Every part tested with 100% compatibility guarantee.
            </p>
          </div>
        </div>

        {/* Kits vs Spare Parts Tabs for Competition Categories */}
        {category.slug === 'gamified-robots' && (
          <div className="flex border-b border-purple-100 mb-8 overflow-x-auto">
            <Link
              href={`/category/${slug}`}
              className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'border-purple-700 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-purple-950'
              }`}
            >
              All Products
            </Link>
            <Link
              href={`/category/${slug}?type=kit`}
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
              href={`/category/${slug}?type=spare_part`}
              className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                typeFilter === 'spare_part'
                  ? 'border-purple-700 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-purple-950'
              }`}
            >
              <Cpu size={16} />
              Compatible Spare Parts
            </Link>
          </div>
        )}

        {/* Main Content Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="p-5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-purple-100">
                <h3 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-purple-700" />
                  Filter Catalogue
                </h3>
                <Link href={`/category/${slug}`} className="text-xs text-slate-500 hover:text-purple-700 font-semibold">
                  Reset
                </Link>
              </div>

              {/* Product Type Filter */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Product Type</h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-slate-900">
                    <input type="radio" name="type" checked={typeFilter === 'all'} readOnly className="accent-purple-700" />
                    <span>All Items</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-slate-900">
                    <input type="radio" name="type" checked={typeFilter === 'kit'} readOnly className="accent-purple-700" />
                    <span>Complete Competition Kits</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-slate-900">
                    <input type="radio" name="type" checked={typeFilter === 'spare_part'} readOnly className="accent-purple-700" />
                    <span>Replacement Spare Parts</span>
                  </label>
                </div>
              </div>

              {/* In-Stock Toggle */}
              <div className="pt-4 border-t border-purple-100 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer font-semibold">
                  <span>In Stock Only</span>
                  <input type="checkbox" defaultChecked className="accent-purple-700 rounded" />
                </label>
              </div>

              {/* Brand Filter */}
              <div className="pt-4 border-t border-purple-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Brand</h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input type="checkbox" defaultChecked className="accent-purple-700" />
                    <span>Tamizh Tech</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input type="checkbox" defaultChecked className="accent-purple-700" />
                    <span>TTRC Spares</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input type="checkbox" defaultChecked className="accent-purple-700" />
                    <span>TTRC Power</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-50/40 border border-purple-100">
              <p className="text-xs text-slate-600">
                Showing <strong className="text-slate-900">{products.length}</strong> products in <span className="text-purple-700 font-bold">{category.name}</span>
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Sort by:</span>
                <select className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-purple-600 focus:outline-none">
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
                  There are no products currently matching the selected filters. Try clearing your filters.
                </p>
                <Link
                  href={`/category/${slug}`}
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
