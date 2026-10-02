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
          <h2 className="font-heading text-base font-bold text-slate-900">2. Pricing & Payments</h2>
          <p>All prices listed on the storefront are in Indian Rupees (INR) and inclusive of taxes (or Bill of Supply pricing prior to GST registration). Payment may be completed via Cash on Delivery (COD) or Razorpay Online Payment.</p>
        </section>

        <section className="space-y-2 text-xs text-slate-600">
          <h2 className="font-heading text-base font-bold text-slate-900">3. Shipping within India</h2>
          <p>We deliver within serviceable pincodes in India only. Delivery timeline estimates range from 3-7 business days depending on location.</p>
        </section>
      </div>
    </div>
  );
}
