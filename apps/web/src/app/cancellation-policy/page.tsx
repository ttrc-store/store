import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation Policy | TTRC Store',
  description: 'Order cancellation rules and timeline for TTRC Store orders.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-white">Cancellation Policy</h1>
        </div>

        <div className="space-y-4 text-xs text-zinc-400">
          <p>Orders can be cancelled free of charge anytime <strong>before shipment</strong> directly from your `/account/orders` page or by contacting customer support.</p>
          <p>Once a package has been picked up by the courier agent and assigned an AWB tracking number, the order cannot be cancelled in transit.</p>
        </div>
      </div>
    </div>
  );
}
