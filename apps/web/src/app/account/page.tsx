import * as React from 'react';
import Link from 'next/link';
import { Package, MapPin, Heart, ArrowRight, Clock, ShoppingBag } from 'lucide-react';
import { PriceTag } from '@/components/store/price-tag';
import { Button } from '@/components/ui/button';
import { getAccountOverviewAction } from '@/actions/account';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  packed: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-slate-100 text-slate-700 border-slate-300',
  out_for_delivery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  pending_payment: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default async function AccountOverviewPage() {
  const overview = await getAccountOverviewAction();

  if ('error' in overview) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
        Failed to load account overview: {overview.error}
      </div>
    );
  }

  const { totalOrders, savedAddressesCount, defaultAddress, wishlistCount, recentOrders, profile } = overview;

  return (
    <div className="space-y-8">
      {/* Profile Greeting Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">
            Welcome, {profile.fullName}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customer Account • <span className="font-mono">{profile.email}</span>
          </p>
        </div>
        <Link href="/account/privacy">
          <Button variant="outline" size="sm" className="border-slate-200 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl">
            Privacy &amp; Data Rights
          </Button>
        </Link>
      </div>

      {/* Account Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/account/orders" className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-red-300 hover:bg-red-50/30 transition-all flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalOrders}</p>
          </div>
        </Link>

        <Link href="/account/addresses" className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-red-300 hover:bg-red-50/30 transition-all flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Saved Addresses</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">
              {savedAddressesCount > 0 ? `${savedAddressesCount} Saved` : '0 Saved'}
            </p>
          </div>
        </Link>

        <Link href="/account/wishlist" className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-red-300 hover:bg-red-50/30 transition-all flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Wishlist Items</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{wishlistCount} Saved</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-red-600" />
            Recent Orders
          </h2>
          <Link href="/account/orders" className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-red-200 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-red-600">{order.orderNumber}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                        STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{order.name}</p>
                  <p className="text-xs text-slate-500">Placed on {order.date} • {order.itemCount} Item(s)</p>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <PriceTag pricePaise={order.totalPaise} size="sm" />
                  <Link
                    href={`/account/orders`}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Track Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <ShoppingBag size={22} />
            </div>
            <p className="text-sm font-bold text-slate-900">No Recent Orders</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You haven&apos;t placed any orders yet. Start exploring our robotics kits &amp; components!
            </p>
            <Link href="/categories">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-sm mt-1">
                Explore Catalog
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Default Shipping Address Summary */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin size={16} className="text-red-600" />
            Default Delivery Address
          </h3>
          <Link href="/account/addresses" className="text-xs text-red-600 hover:underline font-bold">
            Manage Address Book
          </Link>
        </div>
        {defaultAddress ? (
          <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
            <p className="font-bold text-slate-900">{defaultAddress.full_name}</p>
            <p>{defaultAddress.line1} {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}</p>
            <p>{defaultAddress.city}, {defaultAddress.state} — {defaultAddress.pincode}</p>
            <p className="text-slate-500 font-mono pt-1">Phone: {defaultAddress.phone}</p>
          </div>
        ) : (
          <div className="py-4 text-center space-y-2">
            <p className="text-xs text-slate-500">No default shipping address saved yet.</p>
            <Link href="/account/addresses">
              <Button variant="outline" size="sm" className="border-slate-300 text-xs text-slate-700 font-bold rounded-xl">
                Add Delivery Address
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
