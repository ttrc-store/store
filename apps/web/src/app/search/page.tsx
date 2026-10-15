import * as React from 'react';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, Package } from 'lucide-react';
import { searchStoreProducts, getStoreProducts, toStoreProductCardProps } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';
import { CatalogFilterBar } from '@/components/store/catalog-filter-bar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    sort?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
    brand?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || '';

  return {
    title: query ? `Search results for "${query}" | TTRC Store` : 'Search Products | TTRC Store',
    description: `Browse robotics components, kits, and spare parts matching "${query}" at Tamizh Tech Store.`,
    alternates: {
      canonical: `https://www.ttrc.store/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const query = (resolved.q || '').trim();
  const typeFilter = resolved.type || 'all';
  const sort = resolved.sort || 'featured';
  const inStockOnly = resolved.inStock === 'true';
  const minPrice = resolved.minPrice || '';
  const maxPrice = resolved.maxPrice || '';
  const brand = resolved.brand || 'all';

  const minPricePaise = minPrice ? parseInt(minPrice, 10) * 100 : undefined;
  const maxPricePaise = maxPrice ? parseInt(maxPrice, 10) * 100 : undefined;

  let products = [];
  if (query) {
    products = await searchStoreProducts(query, { limit: 100 });
  } else {
    const res = await getStoreProducts({
      productType: typeFilter,
      sort,
      minPricePaise,
      maxPricePaise,
      inStockOnly,
      brand,
      limit: 60,
    });
    products = res.products;
  }

  // Filter in memory for search results if query was provided
  if (query) {
    if (typeFilter !== 'all') {
      products = products.filter((p) => p.type === typeFilter);
    }
    if (inStockOnly) {
      products = products.filter((p) => p.stockQty > 0);
    }
    if (minPricePaise != null) {
      products = products.filter((p) => p.pricePaise >= minPricePaise);
    }
    if (maxPricePaise != null) {
      products = products.filter((p) => p.pricePaise <= maxPricePaise);
    }
    if (brand !== 'all') {
      products = products.filter((p) => p.brand === brand);
    }

    // Apply sorting
    if (sort === 'price_asc') {
      products.sort((a, b) => a.pricePaise - b.pricePaise);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.pricePaise - a.pricePaise);
    } else if (sort === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'newest') {
      products.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  const results = products;

  return (
    <div className="min-h-screen bg-white text-foreground pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Search</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Search Page Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Search className="text-purple-700" size={28} />
            {query ? (
              <span>
                Search results for <span className="text-purple-700">&quot;{query}&quot;</span>
              </span>
            ) : (
              'All Store Catalog Products'
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            Found <strong className="text-foreground">{results.length}</strong> matching robotics components &amp; competition kits.
          </p>
        </div>

        {/* Main Content Layout with Sidebar Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <CatalogFilterBar
                totalCount={results.length}
                currentType={typeFilter}
                currentSort={sort}
                inStockOnly={inStockOnly}
                minPrice={minPrice}
                maxPrice={maxPrice}
                currentBrand={brand}
              />
            </div>
          </aside>

          <main className="lg:col-span-3">
            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((product) => (
                  <ProductCard key={product.id} {...toStoreProductCardProps(product)} />
                ))}
              </div>
            ) : (
              <div className="p-16 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <Package size={56} className="mx-auto text-slate-400" />
                <h3 className="font-heading text-xl font-bold text-foreground">
                  No products found for &quot;{query}&quot;
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  We couldn&apos;t find any components matching your search and filter criteria. Try broader keywords or reset filters.
                </p>
                <Link
                  href="/search"
                  className="inline-block px-6 py-2.5 rounded-full bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors shadow-sm"
                >
                  Clear Search Filters
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
