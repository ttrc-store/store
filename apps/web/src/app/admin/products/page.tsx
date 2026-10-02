import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/store/price-tag';
import { getAdminProductsAction } from '@/actions/orders';
import AdminProductsClient from './_components/admin-products-client';

export const revalidate = 30;

const TYPE_LABEL: Record<string, string> = {
  kit: 'Robot Kit',
  spare_part: 'Spare Part',
  general: 'Standard',
  standard: 'Standard',
};

const TYPE_COLOR: Record<string, string> = {
  kit: 'bg-purple-50 text-purple-700 border-purple-200',
  spare_part: 'bg-blue-50 text-blue-600 border-blue-200',
  general: 'bg-slate-100 text-slate-600 border-slate-200',
  standard: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? '';
  const type = params.type ?? 'all';
  const page = Number(params.page ?? 1);

  const result = await getAdminProductsAction({ search, type, page, limit: 50 });

  if ('error' in result) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">Product Catalog</h1>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Error loading products: {result.error}
        </div>
      </div>
    );
  }

  const products = result.products ?? [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Product Catalog ({result.total ?? 0})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage store inventory, kit & spare parts logic, pricing, and stock levels.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-purple-900/20">
            <Plus size={16} /> Add New Product
          </Button>
        </Link>
      </div>

      {/* Client search/filter + table */}
      <AdminProductsClient
        products={products}
        total={result.total ?? 0}
        currentSearch={search}
        currentType={type}
        typeLabel={TYPE_LABEL}
        typeColor={TYPE_COLOR}
      />
    </div>
  );
}
