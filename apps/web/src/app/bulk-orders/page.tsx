'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Building, ShieldCheck, FileCheck, PhoneCall, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function BulkOrdersForm() {
  const searchParams = useSearchParams();
  const initialSku = searchParams.get('sku') || '';
  const initialProduct = searchParams.get('product') || '';

  const [submitted, setSubmitted] = React.useState(false);
  const [productName, setProductName] = React.useState(initialProduct);
  const [sku, setSku] = React.useState(initialSku);
  const [quantity, setQuantity] = React.useState('50');
  const [requiredDate, setRequiredDate] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [gstin, setGstin] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#050507] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="border-b border-purple-100 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8FA] text-[#6721F2] text-xs font-bold mb-2 border border-[#AF87F8]/40">
            <Sparkles size={12} className="text-[#844AFB]" /> B2B Commercial &amp; Institutional Quotation
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-[#050507] flex items-center gap-3">
            <Building className="text-[#844AFB]" size={28} />
            Bulk &amp; Institutional Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Special volume discounts, official proforma invoices, and GST tax invoice quotes for
            Schools, STEM Labs, Colleges &amp; Industrial hardware prototyping teams.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-purple-100 shadow-xs">
          {submitted ? (
            <div className="p-8 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-3">
              <ShieldCheck size={36} className="mx-auto text-[#844AFB]" />
              <h2 className="font-heading font-bold text-slate-900 text-lg">
                Quotation Request Received!
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>. Our technical B2B sales team at Tamizh Tech will
                prepare a formal quotation with GSTIN details and send it to{' '}
                <strong>{email}</strong> within 1 business day.
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/917904902978?text=Hello%20TTRC%20Store%2C%20I%20have%20submitted%20a%20bulk%20enquiry%20for%20${encodeURIComponent(
                    productName || 'Robotics components'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#844AFB] hover:text-[#6721F2]"
                >
                  <PhoneCall size={14} /> Immediate Assistance on WhatsApp (+91 7904902978)
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Product / Component Name *</label>
                  <Input
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Robo Race Kit / N20 Motors"
                    className="bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SKU / Model Number</label>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. TTRC-ROBO-RACE"
                    className="bg-slate-50 border-slate-200 h-10 font-mono text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Required Quantity *</label>
                  <Input
                    required
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="50"
                    className="bg-slate-50 border-slate-200 h-10 font-mono text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Delivery Date</label>
                  <Input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Company / College / School Name *</label>
                  <Input
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Tamizh Tech Innovation Lab"
                    className="bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">GSTIN (Optional for tax invoice)</label>
                  <Input
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    className="bg-slate-50 border-slate-200 h-10 font-mono text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Contact Person Name *</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Email *</label>
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@organization.edu"
                    className="bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Phone / WhatsApp Number *</label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Additional Technical Requirements &amp; Custom Sourcing Notes
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mention any custom specifications, kit customization, payment terms, or expedited courier timelines..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-[#844AFB] focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold h-11 text-xs rounded-xl glow-purple-sm transition-all shadow-md"
                >
                  <Send size={14} className="mr-2" />
                  Submit Formal Quotation Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BulkOrdersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFDFD] py-16 text-center text-xs text-slate-500">
          Loading bulk order enquiry form...
        </div>
      }
    >
      <BulkOrdersForm />
    </React.Suspense>
  );
}
