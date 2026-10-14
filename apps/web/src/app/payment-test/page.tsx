'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import { RazorpayButton } from '@/components/checkout/razorpay-button';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentTestPage() {
  // Security guard: Disable completely in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const [testAmount, setTestAmount] = React.useState('100'); // ₹1.00 in rupees
  const [testReceipt] = React.useState('test_rcpt_init');
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const amountPaise = Math.max(100, Math.round((parseFloat(testAmount) || 1) * 100));

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-purple-100 rounded-full text-purple-700 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Razorpay Standard Checkout
          </h1>
          <p className="text-xs text-slate-500">
            Official TTRC Store Payment Gateway Test &amp; Verification
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Test Payment Amount (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 font-mono text-sm focus:border-purple-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 100 paise (₹1.00). Current: {amountPaise} paise.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
            <p><span className="font-bold">Key ID:</span> {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TnRvg3LwstLPha'}</p>
            <p><span className="font-bold">Gateway:</span> Razorpay Standard Web Checkout</p>
            <p><span className="font-bold">Supported:</span> UPI, Cards, NetBanking, Wallets</p>
          </div>

          <RazorpayButton
            amountPaise={amountPaise}
            receipt={testReceipt}
            label={`Pay ₹${(amountPaise / 100).toFixed(2)} with Razorpay`}
            prefill={{
              name: 'Test Customer',
              email: 'test@ttrc.store',
              contact: '9876543210',
            }}
            notes={{
              testMode: 'true',
              platform: 'TTRC Store',
            }}
            onSuccess={(data) => {
              setResult(data);
              setError(null);
            }}
            onError={(err) => {
              setError(err);
              setResult(null);
            }}
          />

          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                <CheckCircle2 size={16} />
                <span>Payment Verified Successfully!</span>
              </div>
              <p className="text-[11px] font-mono break-all">
                Payment ID: {result.payment_id}
              </p>
              <p className="text-[11px] font-mono break-all">
                Order ID: {result.order_id}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span className="text-[11px]">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
