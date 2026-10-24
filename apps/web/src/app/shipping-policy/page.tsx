import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | TTRC Store',
  description: 'Shipping timeline, rates, and restricted components policy for TTRC Store.',
  alternates: {
    canonical: 'https://www.ttrc.store/shipping-policy',
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">Shipping & Delivery Policy</h1>
          <p className="text-xs text-purple-700 font-mono font-bold mt-1">Delivery within India via Shiprocket Courier Partners</p>
        </div>

        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200">
            <h2 className="font-bold text-slate-900 text-sm mb-1">Dispatch Within 10 Days Guarantee</h2>
            <p>Every robotics kit, motor, and electronic module undergoes strict engineering inspection and functional bench-testing prior to shipment. All orders are carefully packed with anti-static protection and <strong>dispatched within 10 days</strong> of verified order placement from our central warehouse in Coimbatore, Tamil Nadu.</p>
          </div>

          <h2 className="font-bold text-slate-900 text-sm">Payment Methods Policy (Online Payment Only)</h2>
          <p>TTRC Store operates exclusively with 100% secure online payments processed through Razorpay Standard Checkout (UPI, Google Pay, PhonePe, Paytm, all Credit/Debit Cards, NetBanking, and EMI). Cash on Delivery (COD) is not offered or supported on any order.</p>

          <h2 className="font-bold text-slate-900 text-sm">Pan-India Delivery Timelines Post-Dispatch</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tamil Nadu &amp; South India:</strong> 2–4 Business Days delivery transit post-dispatch</li>
            <li><strong>Rest of India:</strong> 4–7 Business Days delivery transit post-dispatch</li>
          </ul>

          <h2 className="font-bold text-slate-900 text-sm">Restricted Goods (Lithium Batteries &amp; Drone Frames)</h2>
          <p>LiPo and Li-ion batteries are classified as surface-only transport goods per Indian courier regulations. Orders containing high-capacity batteries will be routed exclusively via surface shipping.</p>
        </div>
      </div>
    </div>
  );
}
