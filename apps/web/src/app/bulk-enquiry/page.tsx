'use client';

import * as React from 'react';
import { Send, Building, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BulkEnquiryPage() {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Building className="text-purple-700" size={28} />
            Institutional & Bulk Order Enquiry
          </h1>
          <p className="text-xs text-slate-500 mt-1">Special institutional discounts and GST tax invoice quotes for Schools, STEM Labs & Competition Teams.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="p-8 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-3">
              <ShieldCheck size={32} className="mx-auto text-purple-700" />
              <h2 className="font-bold text-slate-900 text-base">Institutional Enquiry Received!</h2>
              <p className="text-xs text-slate-600">Our B2B sales team will send a formal quote with GST details to your email within 1 business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Contact Person Name *</label>
                  <Input required placeholder="Prof. Rajesh Kumar" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Institution / Organization Name *</label>
                  <Input required placeholder="PSG College of Technology Robotics Club" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Email *</label>
                  <Input required type="email" placeholder="robotics@psgtech.ac.in" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone / WhatsApp Number *</label>
                  <Input required placeholder="+91 98765 43210" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Required Robotics Kits / Components List & Quantities *</label>
                <textarea required rows={4} placeholder="e.g. 50x Robo Race Kits, 100x N20 Motors, 20x 3S LiPo Chargers" className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200" />
              </div>

              <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold h-11 text-xs rounded-full glow-purple-sm">
                <Send size={14} className="mr-2" /> Request Quotation
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
