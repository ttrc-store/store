import * as React from 'react';
import { ProductCard, ProductCardProps } from './product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductGridProps {
  products: ProductCardProps[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  columns?: 'standard' | 'dense' | 'wide';
}

export function ProductGrid({
  products,
  isLoading = false,
  emptyTitle = 'No products found',
  emptyDescription = 'There are no items matching this criteria right now.',
  className,
  columns = 'standard',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4',
          columns === 'dense' && 'lg:grid-cols-6',
          columns === 'wide' && 'lg:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="pt-2 flex justify-between items-center">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-8 w-14 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<Package size={36} />}
        title={emptyTitle}
        description={emptyDescription}
        className="my-12 py-16"
      />
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4',
        columns === 'dense' && 'lg:grid-cols-6',
        columns === 'wide' && 'lg:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
