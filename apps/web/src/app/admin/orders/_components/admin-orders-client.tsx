'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, Eye, Package } from 'lucide-react';
import { PriceTag } from '@/components/store/price-tag';
import { updateOrderStatusAction } from '@/actions/admin';
import type { OrderListItem } from '@/actions/orders';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

const STATUS_OPTIONS = [
  'all',
  'pending_payment',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
  processing: 'bg-amber-50 text-amber-600 border-amber-200',
  packed: 'bg-purple-50 text-purple-600 border-purple-200',
  shipped: 'bg-slate-100 text-slate-700 border-slate-300',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  pending_payment: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  payment_failed: 'bg-red-100 text-red-700 border-red-300',
  return_requested: 'bg-orange-50 text-orange-700 border-orange-200',
  returned: 'bg-slate-100 text-slate-600 border-slate-300',
  refunded: 'bg-teal-50 text-teal-700 border-teal-200',
  out_for_delivery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

interface Props {
  orders: OrderListItem[];
  total: number;
  currentStatus: string;
  currentSearch: string;
}

export default function AdminOrdersClient({
  orders,
  total,
  currentStatus,
  currentSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = React.useState(currentSearch);
  const [editingOrderId, setEditingOrderId] = React.useState<string | null>(null);
  const [newStatus, setNewStatus] = React.useState('');
  const [newAwb, setNewAwb] = React.useState('');
  const [adminNote, setAdminNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch) {
        params.set('search', localSearch);
      } else {
        params.delete('search');
      }
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => clearTimeout(t);
  }, [localSearch]);

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const openEditModal = (order: OrderListItem) => {
    setEditingOrderId(order.id);
    setNewStatus(order.status);
    setNewAwb('');
    setAdminNote('');
    setModalError(null);
  };

  const handleUpdateStatus = async () => {
    if (!editingOrderId || !newStatus) return;
    setSaving(true);
    setModalError(null);

    const result = await updateOrderStatusAction(
      editingOrderId,
      newStatus,
      newAwb || undefined,
      adminNote || undefined
    );

    setSaving(false);

    if (result.error) {
      setModalError(result.error);
      return;
    }

    setEditingOrderId(null);
    router.refresh();
  };

  return (
    <>
      {/* Filter & Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by order number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={currentStatus}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
        {orders.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-purple-50/50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3 rounded-l-lg">Order</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="py-3">
                    <p className="font-mono font-bold text-slate-900">
                      {order.order_number ?? order.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="py-3">
                    <PriceTag pricePaise={order.total_paise} size="sm" />
                  </td>
                  <td className="py-3 text-slate-500 capitalize font-medium">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(order)}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold transition-colors border border-purple-200"
                      >
                        Update Status
                      </button>
                      <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-purple-700 transition-colors"
                        title="View Order"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-700">
              <Package size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-slate-900">No Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Customer orders appear here once placed. Try adjusting your status filter.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {editingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-slate-900">Update Order Status</h3>
            <p className="text-[11px] text-slate-500 font-mono break-all">{editingOrderId}</p>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
                >
                  {STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS] ?? s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Courier AWB / Tracking Number (optional)
                </label>
                <input
                  type="text"
                  value={newAwb}
                  onChange={(e) => setNewAwb(e.target.value)}
                  placeholder="e.g. SR-84920412-IN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Note (optional)</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Dispatched from Coimbatore warehouse"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingOrderId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 disabled:opacity-60 shadow-sm shadow-purple-900/20"
              >
                {saving ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
