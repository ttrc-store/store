'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Save,
  Loader2,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Receipt,
} from 'lucide-react';
import { formatRupees } from '@/lib/utils';
import { updateOrderStatusAction } from '@/actions/admin';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Payment / Unprocessed' },
  { value: 'processing', label: 'Processing / In Packing' },
  { value: 'shipped', label: 'Shipped (In Transit)' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled (Restocks Inventory)' },
  { value: 'return_requested', label: 'Return Requested' },
  { value: 'returned', label: 'Returned to Facility' },
  { value: 'refunded', label: 'Refunded' },
];

export default function AdminOrderDetailClient({ order }: { order: any }) {
  const router = useRouter();

  const [status, setStatus] = React.useState(order.status);
  const [trackingNumber, setTrackingNumber] = React.useState(order.tracking_number || '');
  const [adminNote, setAdminNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateOrderStatusAction(
        order.id,
        status,
        trackingNumber.trim() || undefined,
        adminNote.trim() || undefined
      );

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(`Order updated to status "${ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}".`);
        setAdminNote('');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  const isPaid = order.payment_status === 'paid';
  const isOnline = order.payment_method === 'razorpay';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
      {/* LEFT 2 COLUMNS: Order Summary, Items, Payment, Addresses */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status Strip Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Status</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs border ${
                    order.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : order.status === 'shipped'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : order.status === 'cancelled'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs border ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : order.payment_status === 'failed'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}
                >
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
              <p className="mt-1 font-bold text-slate-800 capitalize">
                {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay (Online Payment)'}
              </p>
            </div>
          </div>
        </div>

        {/* Immutable Item Snapshots Table */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Package size={16} className="text-[#E3132A]" /> Ordered Items ({order.items.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Immutable Order Snapshot</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Item Details</th>
                  <th className="pb-3">SKU &amp; HSN</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Tax (GST)</th>
                  <th className="pb-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          <Image
                            src={item.image_url || '/brand/ttrc-logo.png'}
                            alt={item.product_name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{item.product_name}</p>
                          {item.bulk_tier_applied && (
                            <span className="text-[10px] text-[#E3132A] font-semibold">
                              Tier: {item.bulk_tier_applied}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 font-mono text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800">{item.sku}</p>
                      <p className="text-[10px] text-slate-400">HSN: {item.hsn_code}</p>
                    </td>

                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupees(item.unit_price)}
                    </td>

                    <td className="py-3 text-center font-bold text-slate-800">
                      ×{item.quantity}
                    </td>

                    <td className="py-3 text-right text-slate-500 font-mono text-[11px]">
                      {item.gst_percent}% GST
                    </td>

                    <td className="py-3 text-right font-mono font-black text-slate-900">
                      {formatRupees(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-800">{formatRupees(order.subtotal_paise)}</span>
              </div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-mono font-semibold">−{formatRupees(order.discount_paise)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (Included/Applicable)</span>
                <span className="font-mono font-semibold text-slate-800">{formatRupees(order.tax_total_paise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charge</span>
                <span className="font-mono font-semibold text-slate-800">{formatRupees(order.shipping_total_paise)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="font-mono text-base text-[#E3132A]">{formatRupees(order.total_paise)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway Reconciliation Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard size={16} className="text-[#E3132A]" /> Payment Gateway &amp; Audit Reference
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <p className="text-[10px] text-slate-400 font-sans font-bold uppercase">Razorpay Order ID</p>
              <p className="font-bold text-slate-800 mt-0.5">{order.razorpay_order_id || 'Not initiated'}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-sans font-bold uppercase">Razorpay Payment ID</p>
              <p className="font-bold text-slate-800 mt-0.5">{order.razorpay_payment_id || 'Pending payment'}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-sans font-bold uppercase">Cryptographic Signature</p>
              <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                {order.razorpay_signature ? 'Verified (HMAC-SHA256 Match)' : 'Pending signature verification'}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-sans font-bold uppercase">Official Bill / Invoice Ref</p>
              <p className="font-bold text-slate-800 mt-0.5">{order.bill_number || 'Generated at verification'}</p>
            </div>
          </div>
        </div>

        {/* Addresses & Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-heading font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
              <MapPin size={14} className="text-[#E3132A]" /> Delivery Destination
            </h3>
            <p className="font-bold text-slate-900">{order.shipping_address?.fullName || 'Customer'}</p>
            <p className="text-slate-600">
              {order.shipping_address?.line1}
              {order.shipping_address?.line2 ? `, ${order.shipping_address.line2}` : ''}
            </p>
            <p className="text-slate-600">
              {order.shipping_address?.city}, {order.shipping_address?.state} —{' '}
              <span className="font-mono font-bold text-slate-800">{order.shipping_address?.pincode}</span>
            </p>
            <p className="text-slate-500 font-mono text-[11px] pt-1">Phone: {order.shipping_address?.phone}</p>
          </div>

          {/* Billing Address / Customer Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-heading font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
              <User size={14} className="text-[#E3132A]" /> Customer Profile
            </h3>
            {order.customer ? (
              <>
                <p className="font-bold text-slate-900">{order.customer.full_name}</p>
                <p className="text-slate-600 font-mono">{order.customer.email}</p>
                {order.customer.phone && <p className="text-slate-500 font-mono">Mobile: {order.customer.phone}</p>}
                {order.customer.id && (
                  <Link
                    href={`/admin/customers`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E3132A] hover:underline pt-1"
                  >
                    View Customer Account <ExternalLink size={12} />
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-slate-900">Guest Checkout</p>
                <p className="text-slate-600 font-mono">{order.guest_email || 'No email registered'}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Fulfillment Controls & Audit Timeline */}
      <div className="space-y-6">
        {/* Status Progression Control Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Truck size={16} className="text-[#E3132A]" /> Fulfillment Progression
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Update Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#E3132A]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {!isPaid && isOnline && (
                <p className="text-[10px] text-amber-700 mt-1 font-medium">
                  ⚠️ Note: Unpaid online orders cannot be shipped until payment is confirmed.
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Courier Tracking / AWB Reference
              </label>
              <input
                type="text"
                placeholder="e.g. SR-9842014-IN"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#E3132A]"
              />
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#E3132A] hover:underline inline-flex items-center gap-1 mt-1 font-bold"
                >
                  Track on Carrier Portal <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Internal Administrative Note
              </label>
              <textarea
                rows={3}
                placeholder="Record fulfillment steps, courier handover, or customer support notes..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E3132A]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving Status...' : 'Apply Status Transition'}
            </button>
          </form>

          {/* Historical Order Notes */}
          {order.notes && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Notes Log</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line font-mono text-[11px]">
                {order.notes}
              </div>
            </div>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock size={16} className="text-[#E3132A]" /> Audit Trail &amp; Events ({order.auditLogs.length})
          </h2>

          {order.auditLogs.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No logged events yet.</p>
          ) : (
            <div className="space-y-3">
              {order.auditLogs.map((log: any) => (
                <div key={log.id} className="relative pl-4 border-l-2 border-red-200 space-y-0.5 text-xs">
                  <p className="font-bold text-slate-800">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleString('en-IN')} • Actor: {log.actor_id}
                  </p>
                  {log.metadata?.newStatus && (
                    <p className="text-[11px] text-slate-600">
                      Transition: <span className="font-semibold">{log.metadata.oldStatus}</span> →{' '}
                      <span className="font-bold text-[#E3132A]">{log.metadata.newStatus}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
