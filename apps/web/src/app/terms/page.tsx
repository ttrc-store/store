import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | TTRC Store',
  description: 'Terms and Conditions governing e-commerce transactions on ttrc.store by Tamizh Tech.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">Terms & Conditions</h1>
          <p className="text-xs text-purple-700 font-mono font-bold mt-1">Consumer Protection (E-Commerce) Rules 2020 Compliant</p>
        </div>

        <section className="space-y-2 text-xs text-slate-600">
          <h2 className="font-heading text-base font-bold text-slate-900">1. General</h2>
          <p>This store is operated by Tamizh Tech (tamizhtech.in). By placing an order on ttrc.store, you agree to these Terms and Conditions.</p>
        </section>

        <section className="space-y-2 text-xs text-slate-600">
          <h2 className="font-heading text-base font-bold text-slate-900">2. Pricing &amp; Payments (Online Payment Only)</h2>
          <p>All product prices listed on the storefront catalog are in Indian Rupees (INR) and are excluding GST. Applicable GST (CGST/SGST for Tamil Nadu, IGST for other Indian states) and express courier shipping are calculated and itemized on the official tax invoice at checkout. Payment is completed securely online via Razorpay Standard Checkout (UPI, Google Pay, PhonePe, Cards, NetBanking, EMI). Cash on Delivery (COD) is not accepted.</p>
        </section>

        <section className="space-y-2 text-xs text-slate-600">
          <h2 className="font-heading text-base font-bold text-slate-900">3. Shipping &amp; Dispatch within India</h2>
          <p>We deliver within serviceable pincodes in India only. All orders are bench-tested and <strong>dispatched within 10 days</strong> of verified payment confirmation from our Tamil Nadu central warehouse. Post-dispatch delivery transit timelines range from 2–5 business days depending on delivery location.</p>
        </section>
      </div>
    </div>
  );
}
