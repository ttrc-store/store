import * as React from 'react';
import Link from 'next/link';
import { Package, Download, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/store/price-tag';
import { getMyOrdersAction } from '@/actions/orders';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-600',
  processing: 'bg-amber-50 text-amber-700',
  packed: 'bg-purple-50 text-purple-700',
  shipped: 'bg-slate-100 text-slate-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
  return_requested: 'bg-orange-50 text-orange-700',
  returned: 'bg-slate-100 text-slate-600',
  refunded: 'bg-teal-50 text-teal-700',
  pending_payment: 'bg-yellow-50 text-yellow-700',
  payment_failed: 'bg-red-100 text-red-700',
};

export default async function AccountOrdersPage() {
  const result = await getMyOrdersAction(1, 20);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="text-purple-700" size={22} />
          My Orders &amp; Invoices
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          View live tracking updates, download receipts, or request returns.
        </p>
      </div>

      {'error' in result && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load orders: {result.error}
        </div>
      )}

      {!('error' in result) && (result.orders ?? []).length === 0 && (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-700">
            <Package size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-bold text-slate-900">No Orders Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You haven&apos;t placed any orders yet. Start exploring our robotics catalog!
            </p>
          </div>
          <Link href="/categories">
            <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-full mt-2 shadow-sm glow-purple-sm">
              Shop Now
            </Button>
          </Link>
        </div>
      )}

      {!('error' in result) && (result.orders ?? []).length > 0 && (
        <div className="space-y-4">
          {(result.orders ?? []).map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-purple-700">
                    {order.order_number ?? `#${order.id.slice(0, 8)}`}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 capitalize">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                  </span>
                  <Link href={`/orders/${order.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[11px] border-slate-300 text-slate-700 hover:text-purple-700 hover:border-purple-300"
                    >
                      <Download size={13} className="mr-1 text-purple-700" />
                      View Receipt
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer / Tracking + Total */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Truck size={16} className="text-purple-700 shrink-0" />
                  <span>
                    Shipping:{' '}
                    <strong className="text-slate-900">
                      {order.shipping_paise === 0 ? 'Free' : `₹${Math.round(order.shipping_paise / 100)}`}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <PriceTag pricePaise={order.total_paise} size="default" />
                  {['confirmed', 'processing'].includes(order.status) && (
                    <Link href={`/account/orders/${order.id}/cancel`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">
                        Cancel Order
                      </Button>
                    </Link>
                  )}
                  {order.status === 'delivered' && (
                    <Link href={`/account/orders/${order.id}/return`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100">
                        <RefreshCw size={12} className="mr-1" />
                        Request Return
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
