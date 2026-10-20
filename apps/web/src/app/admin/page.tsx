import * as React from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Eye,
  Users,
  MessageSquareQuote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceDisplay, PriceTag } from '@/components/store/price-display';
import { MetricCard } from '@/components/admin/metric-card';
import { formatRupees } from '@/lib/utils';
import { getAdminDashboardMetricsAction } from '@/actions/orders';
import { getAdminEnquiriesCountAction } from '@/actions/enquiries';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

export const revalidate = 60; // Revalidate every 60 seconds

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
    processing: 'bg-amber-50 text-amber-600 border-amber-200',
    packed: 'bg-purple-50 text-purple-600 border-purple-200',
    shipped: 'bg-slate-100 text-slate-700 border-slate-300',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    pending_payment: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    payment_failed: 'bg-red-100 text-red-700 border-red-300',
  };

  const label = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status;
  const color = colorMap[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      {label}
    </span>
  );
}

export default async function AdminDashboardOverview() {
  const [metrics, enquiriesCount] = await Promise.all([
    getAdminDashboardMetricsAction(),
    getAdminEnquiriesCountAction(),
  ]);

  if ('error' in metrics) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
        Failed to load dashboard metrics: {metrics.error}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: metrics.totalRevenuePaise,
      icon: IndianRupee,
      isPrice: true,
      change: `${metrics.ordersToday} orders today`,
    },
    {
      title: 'Pending Orders',
      value: String(metrics.pendingCount),
      icon: ShoppingBag,
      change: 'Awaiting fulfillment',
      isWarning: metrics.pendingCount > 0,
    },
    {
      title: 'Active Catalog',
      value: `${metrics.totalProducts} Products`,
      icon: Package,
      change: `${metrics.lowStockCount} low stock`,
    },
    {
      title: 'Low / Out of Stock',
      value: `${metrics.outOfStockCount} Out`,
      icon: AlertTriangle,
      change: `${metrics.lowStockCount} low stock`,
      isWarning: metrics.outOfStockCount > 0 || metrics.lowStockCount > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#050507]">
            Admin Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live store metrics from MongoDB Atlas — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/enquiries">
            <Button
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <MessageSquareQuote size={15} className="text-[#844AFB]" />
              <span>Enquiries &amp; RFQ</span>
              {enquiriesCount.newCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1 animate-pulse">
                  {enquiriesCount.newCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shadow-purple-900/10">
              <Plus size={16} /> Add Product
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl">
              View All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* New Enquiries Notification Banner if pending */}
      {enquiriesCount.newCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <MessageSquareQuote size={18} />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-xs sm:text-sm">
                {enquiriesCount.newCount} New Enquiry / Quotation Request{enquiriesCount.newCount > 1 ? 's' : ''} Awaiting Review
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Prospective customers have submitted Contact or RFQ quotation inquiries through the storefront.
              </p>
            </div>
          </div>
          <Link href="/admin/enquiries">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0">
              Manage Enquiries &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <MetricCard
            key={idx}
            title={stat.title}
            value={stat.isPrice ? formatRupees(stat.value as number) : stat.value}
            subtitle={stat.change}
            icon={stat.icon}
            isWarning={stat.isWarning}
          />
        ))}
      </div>

      {/* Summary Stats Breakdown Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <p className="font-heading text-lg font-extrabold text-slate-900">{metrics.publishedProductsCount}</p>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">Published</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <p className="font-heading text-lg font-extrabold text-slate-900">{metrics.draftProductsCount}</p>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">Drafts</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <p className="font-heading text-lg font-extrabold text-slate-900">{metrics.paidOrdersCount}</p>
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mt-0.5">Paid Orders</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <p className="font-heading text-lg font-extrabold text-slate-900">{metrics.pendingOrdersCount}</p>
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider mt-0.5">Pending Pay</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <p className="font-heading text-lg font-extrabold text-slate-900">{metrics.totalCustomers}</p>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">Customers</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <p className="font-heading text-lg font-extrabold text-slate-900">{metrics.recentActivity.length}</p>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">Recent Actions</p>
        </div>
      </div>

      {/* Grid Section: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="font-heading font-bold text-base text-[#14141A] flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#844AFB]" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {metrics.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FDECEE]/30 transition-colors">
                      <td className="py-3">
                        <p className="font-mono font-bold text-slate-900 text-[11px]">
                          {order.order_number ?? order.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(order.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="py-3">
                        <PriceDisplay pricePaise={order.total_paise} size="sm" />
                      </td>
                      <td className="py-3 text-slate-500 capitalize">
                        {order.payment_method}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/orders/${order.id}`} className="p-1 text-slate-400 hover:text-[#844AFB] inline-block">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-40 text-[#844AFB]" />
              No orders yet. When customers place orders, they will appear here.
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="font-heading font-bold text-base text-[#14141A] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#844AFB]" /> Top Products
            </h2>
            <Link href="/admin/products" className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] hover:underline">
              Manage
            </Link>
          </div>

          {metrics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {metrics.topProducts.map((product, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {product.total_qty} sold • SKU: <span className="font-mono">{product.sku}</span>
                    </p>
                  </div>
                  <PriceDisplay pricePaise={product.price} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              Sales data appears here once orders are placed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
