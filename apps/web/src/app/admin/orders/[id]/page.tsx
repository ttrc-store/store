import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Package,
  ExternalLink,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth-helpers';
import { getAdminOrderDetailAction } from '@/actions/orders';
import { formatRupees } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@ttrc/shared';
import AdminOrderDetailClient from './_components/admin-order-detail-client';

export const revalidate = 0; // Dynamic route

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect('/login?redirectTo=/admin/orders');
  }

  const { id } = await params;
  const res = await getAdminOrderDetailAction(id);

  if (res.error || !res.order) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="font-heading text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">
          {res.error || `No order matching ID "${id}" exists in the database.`}
        </p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
        >
          <ArrowLeft size={14} /> Back to Order Directory
        </Link>
      </div>
    );
  }

  const order = res.order;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-black text-slate-900">
                Order {order.order_number}
              </h1>
              {order.bill_number && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                  Bill: {order.bill_number}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <Clock size={13} /> Placed on {new Date(order.created_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Invoice & Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/api/invoice/${order.order_number}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Receipt size={15} className="text-[#E3132A]" />
            View Tax Invoice / Bill
          </Link>
        </div>
      </div>

      {/* Main Content & State Progression Client Component */}
      <AdminOrderDetailClient order={order} />
    </div>
  );
}
