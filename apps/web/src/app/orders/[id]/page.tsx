import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Package, Truck, CheckCircle, MapPin, ArrowLeft, Download } from 'lucide-react';
import { PriceTag } from '@/components/store/price-tag';
import { getMyOrderAction, getGuestOrderAction } from '@/actions/orders';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string; phone?: string }>;
}

export default async function OrderTrackingPage({ params, searchParams }: OrderTrackingPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const decodedId = decodeURIComponent(id);

  const auth = await getAuthenticatedUser();
  const isAuthenticated = !('error' in auth);

  let order: any = null;
  let errorMsg = '';

  if (isAuthenticated) {
    const res = await getMyOrderAction(decodedId);
    if (res.order) {
      order = res.order;
    } else {
      errorMsg = res.error || 'Order not found.';
    }
  } else {
    // Guest customer tracking
    const contact = (resolvedSearchParams.email || resolvedSearchParams.phone || '').trim();
    if (contact) {
      const guestRes = await getGuestOrderAction(decodedId, contact);
      if (guestRes.order) {
        order = guestRes.order;
      } else {
        errorMsg = guestRes.error || 'No matching order found for provided contact details.';
      }
    }
  }

  // If order is still not found and user is not authenticated and didn't provide contact info:
  if (!order && !isAuthenticated && !resolvedSearchParams.email && !resolvedSearchParams.phone) {
    return (
      <div className="min-h-[70vh] bg-white text-slate-900 pb-24 pt-12">
        <div className="max-w-md mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-[#844AFB] flex items-center justify-center mx-auto">
            <Truck size={30} />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold text-slate-900">Track Order #{decodedId}</h1>
            <p className="text-xs text-slate-500">
              Please enter the email address or phone number you provided during checkout to securely view this order.
            </p>
          </div>
          <form method="GET" className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email or Phone Number</label>
              <input
                type="text"
                name="email"
                placeholder="name@example.com or 9876543210"
                required
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#844AFB] focus:ring-1 focus:ring-[#844AFB]"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Verify &amp; View Order Tracking
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Already have an account?{' '}
              <Link href={`/login?redirectTo=/orders/${encodeURIComponent(decodedId)}`} className="text-[#844AFB] font-bold underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status;
  const address = order.shipping_address_snap || {};

  return (
    <div className="min-h-screen bg-white text-foreground pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#844AFB] transition-colors font-medium">
          <ArrowLeft size={14} /> Back to My Orders
        </Link>

        {/* Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-[#844AFB] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
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
              className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-[#844AFB] flex items-center gap-2 transition-colors"
            >
              <Download size={14} /> Tax Invoice
            </a>
          </div>
        </div>

        {/* Status / Tracking Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-[#844AFB]" /> Order Tracking & Status
            </h2>
            {order.shipments?.[0]?.tracking_number ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500">
                  AWB: <strong className="text-slate-900">{order.shipments[0].tracking_number}</strong>
                </span>
                {order.shipments[0].tracking_url && (
                  <a
                    href={order.shipments[0].tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#844AFB] hover:underline"
                  >
                    Track Shipment &rarr;
                  </a>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500">Processing in Warehouse</span>
            )}
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-[#844AFB] flex items-center justify-center font-bold text-sm">
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
              <MapPin size={16} className="text-[#844AFB]" /> Shipping Address
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">
                {address.fullName || (isAuthenticated && 'user' in auth ? auth.user.fullName : 'Customer')}
              </p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.state} — {address.pincode}</p>
              {address.phone && <p className="text-slate-500 pt-1">Phone: {address.phone}</p>}
            </div>
          </div>

          {/* Items & Payment */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package size={16} className="text-[#844AFB]" /> Ordered Items ({order.items.length})
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {order.items.map((item: any) => (
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
