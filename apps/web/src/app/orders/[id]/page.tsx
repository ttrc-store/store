import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Package, Truck, CheckCircle, MapPin, ArrowLeft, Download } from 'lucide-react';
import { PriceTag } from '@/components/store/price-tag';
import { getMyOrderAction } from '@/actions/orders';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const auth = await getAuthenticatedUser();
  if ('error' in auth) {
    redirect('/login?redirectTo=/account/orders');
  }

  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const res = await getMyOrderAction(decodedId);
  if (res.error || !res.order) {
    notFound();
  }

  const order = res.order;
  const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status;
  const address = order.shipping_address_snap || {};

  return (
    <div className="min-h-screen bg-white text-foreground pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors font-medium">
          <ArrowLeft size={14} /> Back to My Orders
        </Link>

        {/* Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 uppercase">
                {statusLabel}
              </span>
              <span className="text-xs text-slate-500">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900 font-mono">
              {order.order_number}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/invoice/${encodeURIComponent(order.order_number)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2 transition-colors"
            >
              <Download size={14} /> Tax Invoice
            </a>
          </div>
        </div>

        {/* Status / Tracking Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-red-600" /> Order Tracking & Status
            </h2>
            {order.shipments?.[0]?.tracking_number ? (
              <span className="text-xs font-mono text-slate-500">
                AWB: <strong className="text-slate-900">{order.shipments[0].tracking_number}</strong>
              </span>
            ) : (
              <span className="text-xs text-slate-500">Processing in Warehouse</span>
            )}
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 capitalize">Current Status: {statusLabel}</p>
              <p className="text-xs text-slate-500">
                Payment Method: {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay (Online Payment)'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery & Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={16} className="text-red-600" /> Shipping Address
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">{address.fullName || auth.user.fullName || 'Customer'}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.state} — {address.pincode}</p>
              {address.phone && <p className="text-slate-500 pt-1">Phone: {address.phone}</p>}
            </div>
          </div>

          {/* Items & Payment */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package size={16} className="text-red-600" /> Ordered Items ({order.items.length})
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.snapshot_name}</p>
                    <p className="text-slate-500 font-mono text-[11px]">SKU: {item.snapshot_sku} • Qty: {item.quantity}</p>
                  </div>
                  <PriceTag pricePaise={item.unit_price_paise * item.quantity} size="sm" />
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold">Total Paid</span>
              <PriceTag pricePaise={order.total_paise} size="default" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
