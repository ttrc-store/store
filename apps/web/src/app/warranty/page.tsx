import * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Warranty & Guarantee Policy | TTRC Store',
  description: 'Warranty terms and quality testing process for electronic components on TTRC Store.',
};

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-white">Warranty Policy</h1>
        </div>

        <div className="space-y-4 text-xs text-zinc-400">
          <p>Every motor, flight controller, sensor array, and lithium battery undergoes quality testing at Tamizh Tech prior to dispatch.</p>
          <h2 className="font-bold text-white text-sm">Testing Guarantee</h2>
          <p>If an item fails upon initial setup without physical or thermal damage, submit a replacement request under our 7-Day Replacement Guarantee.</p>
        </div>
      </div>
    </div>
  );
}
