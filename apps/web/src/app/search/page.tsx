import * as React from 'react';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, Package } from 'lucide-react';
import { searchStoreProducts, getStoreProducts, toStoreProductCardProps } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || '';

  return {
    title: query ? `Search results for "${query}" | TTRC Store` : 'Search Products | TTRC Store',
    description: `Browse robotics components, kits, and spare parts matching "${query}" at Tamizh Tech Store.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q || '').trim();

  let products = [];
  if (query) {
    products = await searchStoreProducts(query, { limit: 50 });
  } else {
    const res = await getStoreProducts({ limit: 50 });
    products = res.products;
  }
  const results = products;

  return (
    <div className="min-h-screen bg-white text-foreground pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
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
        <div className="p-8 rounded-2xl bg-purple-50/60 border border-purple-200 mb-8 space-y-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Search className="text-purple-700" size={28} />
            {query ? (
              <span>
                Search results for <span className="text-purple-700">&quot;{q}&quot;</span>
              </span>
            ) : (
              'All Store Catalog Products'
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            Found <strong className="text-foreground">{results.length}</strong> matching robotics components &amp; competition kits.
          </p>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} {...toStoreProductCardProps(product)} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <Package size={56} className="mx-auto text-slate-400" />
            <h3 className="font-heading text-xl font-bold text-foreground">No products found for &quot;{q}&quot;</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any components matching your query. Try searching for broader terms like &quot;motor&quot;, &quot;battery&quot;, &quot;chassis&quot;, or &quot;sensor&quot;.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-full bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors shadow-sm glow-purple-sm"
            >
              Browse Home Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
