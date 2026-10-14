'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Truck, ArrowRight, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'TTRC/25-26/102948';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
      {/* Brand Logo */}
      <div className="flex justify-center mb-6">
        <Link
          href="/"
          className="inline-block p-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#844AFB] transition-all"
        >
          <Image
            src="/brand/ttrc-logo.png"
            alt="TTRC Store"
            width={140}
            height={38}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Animated Glow & Check Circle */}
      <div className="relative flex justify-center mb-6">
        <div className="absolute -inset-4 rounded-full bg-emerald-500/15 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-xl">
          <CheckCircle2 size={44} className="stroke-[2.5]" />
        </div>
      </div>

      {/* Confirmation Title */}
      <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
        Payment Verified &bull; Dispatch Within 10 Days
      </span>

      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#050507] mt-4 mb-2">
        Thank You for Your Order!
      </h1>
      <p className="text-sm text-slate-500 max-w-lg mx-auto">
        Your order <span className="font-mono font-bold text-slate-900">{orderNumber}</span> has been confirmed. All items are guaranteed for dispatch within 10 days with automated tracking updates.
      </p>

      {/* Details Box */}
      <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 text-left space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Order Number</p>
            <p className="font-mono font-bold text-xl text-[#050507] mt-0.5">{orderNumber}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Estimated Dispatch &amp; Delivery</p>
            <p className="text-sm font-bold text-[#844AFB] mt-0.5 flex items-center gap-1.5 sm:justify-end">
              <Truck size={16} /> Dispatched Within 10 Days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#844AFB]" /> Verified Purchase
            </p>
            <p className="text-slate-500">100% genuine industrial and STEM grade components</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Package size={14} className="text-[#844AFB]" /> Sale Receipt / Invoice
            </p>
            <p className="text-slate-500">Tax invoice / sequential sale receipt generated</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#844AFB]" /> Priority Packing
            </p>
            <p className="text-slate-500">Dispatched from Tamil Nadu central warehouse</p>
          </div>
        </div>

        {/* Order Lifecycle Steps */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 mb-3">What happens next?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EEE8FA] text-[#844AFB] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                1
              </span>
              <span>We pick, inspect, and anti-static bubble pack your components</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EEE8FA] text-[#844AFB] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                2
              </span>
              <span>Courier pickup via BlueDart, Delhivery, or ST Courier</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EEE8FA] text-[#844AFB] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                3
              </span>
              <span>SMS and Email updates sent at every milestone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-11 px-8 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-md shadow-[#844AFB]/20 flex items-center justify-center gap-2">
            <span>Continue Shopping</span>
            <ArrowRight size={15} />
          </Button>
        </Link>
        <Link href="/account/orders" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto h-11 px-6 border-slate-300 hover:border-[#844AFB] hover:bg-[#EEE8FA] text-slate-800 font-bold text-xs rounded-xl"
          >
            <Package size={15} className="mr-1.5" />
            <span>View All My Orders</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[85vh] bg-[#FDFDFD] text-[#050507] flex items-center justify-center">
      <React.Suspense
        fallback={
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading order confirmation...
          </div>
        }
      >
        <CheckoutSuccessContent />
      </React.Suspense>
    </div>
  );
}
