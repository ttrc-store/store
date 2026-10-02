'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordAction } from '@/actions/auth';

export default function ResetPasswordPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const res = await resetPasswordAction(formData);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(res.success);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 text-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block p-3 rounded-xl bg-[#0B132B] border border-[#1E293B] shadow-md">
            <Image
              src="/brand/ttrc-logo.png"
              alt="TTRC Store Logo"
              width={160}
              height={44}
              priority
              className="mx-auto object-contain"
            />
          </Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500">
            Please enter your new account password below.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-semibold">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                name="password"
                type="password"
                required
                placeholder="At least 6 characters"
                className="pl-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-red-600 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm password"
                className="pl-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-red-600 focus:ring-red-600"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-red-900/20"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
          <Link href="/login" className="text-red-600 font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
