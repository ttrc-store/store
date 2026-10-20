'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitEnquiryAction } from '@/actions/enquiries';

function RfqFormContent() {
  const searchParams = useSearchParams();
  const initialProduct = searchParams.get('product') || '';
  const initialSku = searchParams.get('sku') || '';
  const initialQuantity = searchParams.get('quantity') || '10';
  const initialProductId = searchParams.get('productId') || '';

  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    productName: initialProduct,
    sku: initialSku,
    productId: initialProductId,
    quantity: initialQuantity,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const qty = parseInt(formData.quantity, 10);
      const res = await submitEnquiryAction({
        type: 'RFQ',
        name: formData.name,
        email: formData.email,
        mobile: formData.phone,
        phone: formData.phone,
        organization: formData.organization || undefined,
        productId: formData.productId || undefined,
        productName: formData.productName || undefined,
        sku: formData.sku || undefined,
        quantity: !isNaN(qty) && qty > 0 ? qty : undefined,
        message: formData.message,
        sourcePage: '/rfq',
      });

      if (res.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          productName: '',
          sku: '',
          productId: '',
          quantity: '10',
          message: '',
        });
      } else {
        setErrorMsg(res.error || 'Failed to submit quote request.');
      }
    } catch {
      setErrorMsg('Failed to submit quote request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
      {submitted ? (
        <div className="p-8 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-3">
          <CheckCircle2 size={36} className="mx-auto text-purple-700" />
          <h2 className="font-heading font-bold text-slate-900 text-lg">
            Quotation Request Received!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you for reaching out. Our engineering and technical sales team will review your
            requirements and send a formal quotation within 24 business hours.
          </p>
          <Button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl"
          >
            Submit Another Request
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arun Kumar"
                className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mobile Number *</label>
              <Input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Email Address *</label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@organization.com"
                className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Organization / Institution</label>
              <Input
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g. Robotics Club / College Name"
                className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600 text-xs"
              />
            </div>
          </div>

          {/* Product Reference Fields */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <FileText size={14} className="text-purple-700" />
              Product Specification / Quantity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-slate-600 text-[11px]">Product Name</label>
                <Input
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. 4WD Robo Race Kit"
                  className="bg-white border-slate-200 h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 text-[11px]">Target Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="10"
                  className="bg-white border-slate-200 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 text-[11px]">SKU / Part Number (optional)</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. ROB-KIT-4WD-01"
                className="bg-white border-slate-200 h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Message &amp; Requirements *</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please provide details about your technical requirements, expected delivery timeline, and any customization needed..."
              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold h-11 text-xs rounded-full shadow-md transition-colors disabled:opacity-50"
          >
            <Send size={14} className="mr-2" />
            {loading ? 'Submitting Quotation Request...' : 'Submit Request for Quote'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function RfqPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2 border border-purple-200">
            <ShieldCheck size={14} /> Official Technical Quotation
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">
            Request for Quote (RFQ)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit custom procurement, institutional bulk pricing, and specialized robotics kit inquiries.
            Our technical sales team will generate a formal proforma quote with GST details.
          </p>
        </div>

        <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading RFQ form...</div>}>
          <RfqFormContent />
        </React.Suspense>
      </div>
    </div>
  );
}
