import * as React from 'react';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SlidersHorizontal, Package, Cpu } from 'lucide-react';
import { getStoreProducts, toStoreProductCardProps } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';
import { CatalogFilterBar } from '@/components/store/catalog-filter-bar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/components/seo/json-ld';
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

  const title = `${category.name} — Robotics & STEM Components | TTRC Store`;
  const description = `Buy high quality ${category.name} components, kits, and spare parts online at Tamizh Tech Store. 100% genuine components with GST invoice & fast shipping across India.`;
  const canonicalUrl = `https://www.ttrc.store/category/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: 'https://www.ttrc.store/brand/ttrc-logo.png', width: 1200, height: 630 }],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedParams = await searchParams;

  const typeFilter = typeof resolvedParams.type === 'string' ? resolvedParams.type : 'all';
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'featured';
  const inStockOnly = resolvedParams.inStock === 'true';
  const minPrice = typeof resolvedParams.minPrice === 'string' ? resolvedParams.minPrice : '';
  const maxPrice = typeof resolvedParams.maxPrice === 'string' ? resolvedParams.maxPrice : '';
  const brand = typeof resolvedParams.brand === 'string' ? resolvedParams.brand : 'all';

  const minPricePaise = minPrice ? parseInt(minPrice, 10) * 100 : undefined;
  const maxPricePaise = maxPrice ? parseInt(maxPrice, 10) * 100 : undefined;

  await connectToDatabase();
  const dbCat = await CategoryModel.findOne({ slug }).lean();
  const category = dbCat ? { name: dbCat.name, slug: dbCat.slug, description: dbCat.description } : CATEGORY_TREE.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Fetch real products from MongoDB
  const { products, total } = await getStoreProducts({
    categorySlug: slug,
    productType: typeFilter,
    sort,
    minPricePaise,
    maxPricePaise,
    inStockOnly,
    brand,
    limit: 60,
  });

  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Categories', url: 'https://www.ttrc.store/category/gamified-robots' },
    { name: category.name, url: `https://www.ttrc.store/category/${slug}` },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd
        name={`${category.name} Components`}
        description={'description' in category ? (category as any).description : undefined}
        items={products.map((p, idx) => ({
          name: p.name,
          url: `https://www.ttrc.store/product/${p.slug}`,
          position: idx + 1,
        }))}
      />

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
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <CatalogFilterBar
                totalCount={total}
                currentType={typeFilter}
                currentSort={sort}
                inStockOnly={inStockOnly}
                minPrice={minPrice}
                maxPrice={maxPrice}
                currentBrand={brand}
              />
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3 space-y-6">
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
