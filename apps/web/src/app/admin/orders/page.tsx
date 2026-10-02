import * as React from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, Package } from 'lucide-react';
import { PriceTag } from '@/components/store/price-tag';
import { getAdminOrdersAction } from '@/actions/orders';
import AdminOrdersClient from './_components/admin-orders-client';

export const revalidate = 30;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? 'all';
  const search = params.search ?? '';
  const page = Number(params.page ?? 1);

  const result = await getAdminOrdersAction({ status, search, page, limit: 50 });

  if ('error' in result) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Order Fulfillment & Tracking
        </h1>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Error loading orders: {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Order Fulfillment & Tracking ({result.total ?? 0})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer orders, update shipping statuses, and assign courier tracking numbers.
          </p>
        </div>
      </div>

      {/* Client component handles search/filter/modal without losing server data */}
      <AdminOrdersClient
        orders={result.orders ?? []}
        total={result.total ?? 0}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
