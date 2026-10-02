import * as React from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, MapPin, FileText, ArrowLeft, Download, ShieldCheck, ChevronRight } from 'lucide-react';
import { PriceTag } from '@/components/store/price-tag';

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // Mock order tracking details based on order ID
  const trackingTimeline = [
    { title: 'Order Placed & Confirmed', description: 'Payment verified via Razorpay', time: 'Sep 21, 2026 • 07:45 PM', completed: true },
    { title: 'Processing & Quality Check', description: 'Components inspected & packed at TN warehouse', time: 'Sep 21, 2026 • 09:12 PM', completed: true },
    { title: 'Dispatched via Shiprocket', description: 'AWB #SR-84920412-IN assigned (Express Courier)', time: 'Sep 22, 2026 • 08:30 AM', completed: true },
    { title: 'Out for Delivery', description: 'Delivery executive assigned', time: 'Estimated Sep 23, 2026', completed: false, active: true },
    { title: 'Delivered', description: 'Recipient signature required', time: 'Expected by 5:00 PM', completed: false },
  ];

  const items = [
    { id: '1', name: 'Robo Race Chassis Kit - Pro Edition', qty: 1, pricePaise: 249900 },
    { id: '2', name: 'N20 Micro Metal Gear Motor 600 RPM', qty: 2, pricePaise: 35000 },
    { id: '3', name: '3S 11.1V 2200mAh 35C LiPo Battery', qty: 1, pricePaise: 185000 },
  ];

  return (
    <div className="min-h-screen bg-white text-foreground pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-700 transition-colors font-medium">
          <ArrowLeft size={14} /> Back to My Orders
        </Link>

        {/* Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                In Transit
              </span>
              <span className="text-xs text-slate-500">Placed on Sep 21, 2026</span>
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900 font-mono">
              {decodedId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/invoice/${encodeURIComponent(decodedId)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-700 flex items-center gap-2 transition-colors"
            >
              <Download size={14} /> Tax Invoice (PDF)
            </a>
          </div>
        </div>

        {/* Tracking Timeline Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-purple-700" /> Shiprocket Shipment Tracking
            </h2>
            <span className="text-xs font-mono text-slate-500">AWB: <strong className="text-slate-900">SR-84920412-IN</strong></span>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {trackingTimeline.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.completed
                    ? 'bg-purple-700 text-white ring-4 ring-purple-100'
                    : step.active
                    ? 'bg-amber-400 text-black animate-pulse ring-4 ring-amber-100'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step.completed ? <CheckCircle size={12} /> : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${step.completed || step.active ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.title}
                    </h3>
                    <span className="text-[11px] text-slate-400">{step.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery & Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={16} className="text-purple-700" /> Shipping Address
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">Karthik Raja</p>
              <p>12/42 Tamizh Tech Robotics Club</p>
              <p>Peelamedu, Coimbatore — 641004</p>
              <p className="text-slate-500">Tamil Nadu, India</p>
              <p className="text-slate-500 pt-1">Phone: +91 98765 43210</p>
            </div>
          </div>

          {/* Items & Payment */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package size={16} className="text-purple-700" /> Ordered Items ({items.length})
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-slate-500">Qty: {item.qty}</p>
                  </div>
                  <PriceTag pricePaise={item.pricePaise * item.qty} size="sm" />
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold">Total Paid (Cash on Delivery)</span>
              <PriceTag pricePaise={504900} size="default" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
