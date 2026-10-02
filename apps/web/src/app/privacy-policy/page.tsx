import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | DPDP Compliance | TTRC Store',
  description: 'Privacy Policy for TTRC Store in accordance with India Digital Personal Data Protection (DPDP) Act 2023.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-purple-700 font-mono font-bold mt-1">Compliant with India DPDP Act 2023 | Last Updated: September 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            Tamizh Tech (operating as ttrc.store) collects personal data necessary to fulfill order processing and delivery:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li><strong>Identity & Contact Data:</strong> Full Name, Email Address, Phone Number, Shipping Address, Pincode.</li>
            <li><strong>Transactional Data:</strong> Order history, payment method reference tokens, invoice details.</li>
            <li><strong>Technical Data:</strong> IP address, device viewport, browser type for fraud prevention and analytics.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">2. Purpose of Data Processing</h2>
          <p className="text-xs text-slate-600">
            Your personal data is processed solely for order dispatch, shipment tracking notifications via courier partners (Shiprocket), payment verification, tax receipt generation, and customer support.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">3. Your Data Principal Rights (DPDP Act 2023)</h2>
          <p className="text-xs text-slate-600">Under the Digital Personal Data Protection Act 2023, you hold full control over your personal data:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li><strong>Right to Access & Export:</strong> You can download a complete JSON dump of your profile and orders anytime via the `/account` dashboard.</li>
            <li><strong>Right to Erasure:</strong> You can submit a 1-click Account Deletion Request in `/account` to anonymize or delete your records within 30 days.</li>
            <li><strong>Right to Withdraw Consent:</strong> You may opt out of non-essential marketing emails at any time.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">4. Data Sharing & Courier Partners</h2>
          <p className="text-xs text-slate-600">
            We do not sell, rent, or trade your personal data. Shipping address details are strictly shared with integrated courier partners (Shiprocket, Bluedart, Delhivery, India Post) solely for physical package delivery.
          </p>
        </section>
      </div>
    </div>
  );
}
