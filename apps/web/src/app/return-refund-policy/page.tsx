import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | TTRC Store',
  description: 'Return guidelines, replacement, and refund policies for robotics components on TTRC Store.',
};

export default function ReturnRefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">Return & Refund Policy</h1>
          <p className="text-xs text-purple-700 font-mono font-bold mt-1">7-Day Replacement Policy for Defective Components</p>
        </div>

        <div className="space-y-4 text-xs text-slate-600">
          <p>We take extreme care to inspect and test electronic components prior to shipment. If you receive a damaged or non-working item, we offer a <strong>7-Day Replacement Window</strong> from delivery date.</p>

          <h2 className="font-bold text-slate-900 text-sm">Eligibility for Replacement</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Item must be unused, un-soldered, and in original packaging.</li>
            <li>An unboxing video recorded at time of delivery is required for physical damage claims.</li>
            <li>Burnt motors, short-circuited microcontrollers, or swollen LiPo batteries resulting from user error or overvoltage are excluded from warranty replacement.</li>
          </ul>

          <h2 className="font-bold text-slate-900 text-sm">Refund Processing</h2>
          <p>Approved refunds for online payments are credited back to the original source within 5–7 working days via Razorpay. COD orders are refunded via direct bank transfer (NEFT/UPI).</p>
        </div>
      </div>
    </div>
  );
}
