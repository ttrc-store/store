'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordAction } from '@/actions/auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || '';
  const defaultChallenge = searchParams.get('challenge') || '';

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
      setLoading(false);
    } else if (res?.success) {
      setSuccess(res.success);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F7F8] text-[#14141A] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6 p-8 sm:p-10 rounded-3xl bg-white border border-[#E5E7EB] shadow-xl relative overflow-hidden">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block p-2 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#844AFB] transition-all">
            <Image
              src="/brand/ttrc-logo.png"
              alt="TTRC Store Logo"
              width={140}
              height={38}
              priority
              className="h-8 w-auto mx-auto object-contain"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8FA] text-[#844AFB] text-xs font-bold">
            <ShieldCheck size={14} /> Password Reset
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#14141A] tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-[#6B7280]">
            Enter your verification code and choose a new password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="challengeId" value={defaultChallenge} />

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14141A]">Account Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                name="email"
                type="email"
                defaultValue={defaultEmail}
                required
                placeholder="name@example.com"
                className="pl-10 bg-[#F7F7F8] border-[#E5E7EB] text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14141A]">6-Digit Verification Code</label>
            <Input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="123456"
              className="font-mono text-center tracking-widest text-lg font-bold bg-[#F7F7F8] border-[#E5E7EB] h-11 focus:border-[#844AFB] focus:ring-[#844AFB]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14141A]">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                name="password"
                type="password"
                required
                placeholder="At least 6 characters"
                className="pl-10 bg-[#F7F7F8] border-[#E5E7EB] text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14141A]">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm new password"
                className="pl-10 bg-[#F7F7F8] border-[#E5E7EB] text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </Button>
        </form>

        <p className="text-center text-xs text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <Link href="/login" className="text-[#844AFB] font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F7F8]">
          <div className="text-sm font-semibold text-slate-500">Loading password reset...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}
