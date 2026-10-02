import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | TTRC Store',
  description: 'Common questions about shipping, spare parts compatibility, payment methods, and robotics kits.',
};

export default function FAQPage() {
  const faqs = [
    {
      q: 'Are spare parts sold on TTRC Store compatible with my robotics kit?',
      a: 'Yes! Every spare part page features a "Compatible with" section listing exact kit models. You can also view recommended spare parts on kit detail pages.',
    },
    {
      q: 'Do you offer Cash on Delivery (COD)?',
      a: 'Yes, Cash on Delivery is available for serviceable pincodes across India for orders up to ₹5,000.',
    },
    {
      q: 'How long does delivery take?',
      a: 'South India orders typically deliver in 2–4 business days; rest of India in 4–7 business days via courier tracking.',
    },
    {
      q: 'How can institutional buyers / STEM labs order in bulk?',
      a: 'Visit our Bulk Enquiry page (/bulk-enquiry) or email support@tamizhtech.in for institutional quotes and GST invoices.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="text-purple-700 font-mono font-bold">Q.</span> {faq.q}
              </h2>
              <p className="text-xs text-slate-600 pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
