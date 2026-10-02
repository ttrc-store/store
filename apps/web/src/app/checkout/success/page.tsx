'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Truck, ArrowRight, Download, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'TTRC/25-26/102948';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      {/* Animated Glow & Check Circle */}
      <div className="relative flex justify-center mb-6">
        <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-xl">
          <CheckCircle2 size={44} className="stroke-[2.5]" />
        </div>
      </div>

      {/* Confirmation Title */}
      <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        Order Confirmed
      </span>

      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-2">
        Thank You for Your Order!
      </h1>
      <p className="text-sm text-slate-500 max-w-lg mx-auto">
        Your order <span className="font-mono font-bold text-slate-900">{orderNumber}</span> has been successfully placed. We&apos;ve sent a confirmation email with details.
      </p>

      {/* Details Box */}
      <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 text-left space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Order Number</p>
            <p className="font-mono font-bold text-lg text-slate-900 mt-0.5">{orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimated Delivery</p>
            <p className="text-sm font-bold text-purple-700 mt-0.5 flex items-center gap-1.5 justify-end">
              <Truck size={16} /> 2–4 Business Days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-purple-700" /> Cash on Delivery Confirmed
            </p>
            <p className="text-slate-500">Pay cash/UPI upon package delivery</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Package size={14} className="text-purple-700" /> Sale Receipt / Invoice Ready
            </p>
            <p className="text-slate-500">Official receipt with sequential number generated</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href={`/orders/${encodeURIComponent(orderNumber)}`} className="w-full sm:w-auto">
          <Button className="w-full h-11 px-8 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-full shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 glow-purple-sm">
            <Package size={16} /> Track Order Status <ArrowRight size={16} />
          </Button>
        </Link>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full h-11 px-6 border-slate-200 bg-white hover:bg-purple-50 text-slate-800 font-bold text-xs rounded-full">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[80vh] bg-white text-foreground flex items-center justify-center">
      <React.Suspense fallback={<div className="text-center py-12 text-slate-400 text-xs">Loading order confirmation...</div>}>
        <CheckoutSuccessContent />
      </React.Suspense>
    </div>
  );
}
