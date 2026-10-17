'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordResetAction, resetPasswordAction } from '@/actions/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState('');
  const [challengeId, setChallengeId] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(120);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      interval = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const enteredEmail = (formData.get('email') as string)?.trim().toLowerCase();
    setEmail(enteredEmail);

    const res = await requestPasswordResetAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSuccess('A 6-digit password reset verification code has been dispatched to your email.');
      if (res?.challengeId) {
        setChallengeId(res.challengeId);
      }
      setCountdown(120);
      setStep(2);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    formData.append('email', email);
    if (challengeId) {
      formData.append('challengeId', challengeId);
    }

    const res = await resetPasswordAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else if (res?.success) {
      setSuccess('Your password has been updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F7F8] text-[#14141A] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6 p-8 sm:p-10 rounded-3xl bg-white border border-[#E5E7EB] shadow-xl relative overflow-hidden">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block p-2 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#E3132A] transition-all">
            <Image
              src="/brand/ttrc-logo.png"
              alt="TTRC Store Logo"
              width={140}
              height={38}
              priority
              className="h-8 w-auto mx-auto object-contain"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDECEE] text-[#E3132A] text-xs font-bold">
            <ShieldCheck size={14} /> Account Recovery
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#14141A] tracking-tight">
            {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
          </h1>
          <p className="text-xs text-[#6B7280]">
            {step === 1
              ? 'Enter your account email address and we will send a 6-digit one-time password to your inbox.'
              : `Enter the 6-digit code sent to ${email} and choose your new password.`}
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

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#14141A]">Account Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="pl-10 bg-[#F7F7F8] border-[#E5E7EB] text-sm h-11 focus:border-[#E3132A] focus:ring-[#E3132A]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#14141A]">6-Digit Code</label>
                <span className="text-[11px] font-mono text-[#E3132A] inline-flex items-center gap-1">
                  <Clock size={12} /> {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Input
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="123456"
                className="font-mono text-center tracking-widest text-lg font-bold bg-[#F7F7F8] border-[#E5E7EB] h-12 focus:border-[#E3132A] focus:ring-[#E3132A]"
                autoFocus
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
                  className="pl-10 bg-[#F7F7F8] border-[#E5E7EB] text-sm h-11 focus:border-[#E3132A] focus:ring-[#E3132A]"
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
                  placeholder="Re-enter new password"
                  className="pl-10 bg-[#F7F7F8] border-[#E5E7EB] text-sm h-11 focus:border-[#E3132A] focus:ring-[#E3132A]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <Link href="/login" className="text-[#E3132A] font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
