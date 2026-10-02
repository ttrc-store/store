import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | TTRC Store',
  description: 'Shipping timeline, rates, and restricted components policy for TTRC Store.',
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
          <p>Orders are dispatched within 24–48 hours of confirmation from our dispatch warehouse in Coimbatore, Tamil Nadu.</p>

          <h2 className="font-bold text-slate-900 text-sm">Delivery Timelines</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tamil Nadu & South India:</strong> 2–4 Business Days</li>
            <li><strong>Rest of India:</strong> 4–7 Business Days</li>
          </ul>

          <h2 className="font-bold text-slate-900 text-sm">Restricted Goods (Lithium Batteries & Drone Frames)</h2>
          <p>LiPo and Li-ion batteries are classified as surface-only transport goods per Indian courier regulations. Orders containing high-capacity batteries will be routed exclusively via surface shipping.</p>
        </div>
      </div>
    </div>
  );
}
