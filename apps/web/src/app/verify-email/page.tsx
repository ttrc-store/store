'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyEmailOtpAction, requestOtpAction } from '@/actions/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get('email') || '';
  const initialChallengeId = searchParams.get('challenge') || '';
  const redirectTo = searchParams.get('redirect') || '/account';

  const [email, setEmail] = React.useState(emailParam);
  const [challengeId, setChallengeId] = React.useState(initialChallengeId);
  const [otpDigits, setOtpDigits] = React.useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Timer states (Authoritative validation happens on server at 120s)
  const [countdown, setCountdown] = React.useState(120);
  const [resendCooldown, setResendCooldown] = React.useState(60);
  const [resending, setResending] = React.useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // 120-second OTP countdown ticker
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync email from search params if updated
  React.useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
    if (initialChallengeId && !challengeId) {
      setChallengeId(initialChallengeId);
    }
  }, [emailParam, initialChallengeId, email, challengeId]);

  const handleDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Support pasting complete 6-digit code
    if (numeric.length > 1) {
      const sliced = numeric.slice(0, 6).split('');
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        next[i] = sliced[i] || '';
      }
      setOtpDigits(next);
      const targetIndex = Math.min(sliced.length, 5);
      inputRefs.current[targetIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = numeric;
    setOtpDigits(next);

    // Auto-advance focus to next digit
    if (index < 5 && numeric) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please provide your email.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await verifyEmailOtpAction({
      email,
      otp: fullOtp,
      purpose: 'registration',
      challengeId: challengeId || undefined,
      redirectTo,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess('Email verified successfully! Redirecting...');
      setTimeout(() => {
        router.push(res.redirectTo || '/account');
      }, 1500);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setResending(true);
    setError(null);
    setSuccess(null);

    const res = await requestOtpAction({
      email,
      purpose: 'registration',
    });

    setResending(false);

    if (res?.error) {
      setError(res.error);
      if (res.cooldownSeconds) {
        setResendCooldown(res.cooldownSeconds);
      }
    } else if (res?.success) {
      setSuccess('A fresh 6-digit code has been dispatched to your email.');
      setCountdown(res.expiresInSeconds || 120);
      setResendCooldown(res.cooldownSeconds || 60);
      if (res.challengeId) {
        setChallengeId(res.challengeId);
      }
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="min-h-[85vh] bg-[#F7F7F8] text-[#14141A] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 relative overflow-hidden">
        {/* Brand Accent */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block p-2 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#844AFB] transition-all">
            <Image
              src="/brand/ttrc-logo.png"
              alt="TTRC Store"
              width={140}
              height={38}
              priority
              className="h-8 w-auto mx-auto object-contain"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8FA] text-[#844AFB] text-xs font-bold">
            <ShieldCheck size={14} /> Security Verification
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#14141A] tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            We sent a 6-digit security code to{' '}
            <strong className="text-[#14141A]">{email || 'your email address'}</strong>.
            Codes strictly expire in <strong>2 minutes</strong>.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-600 font-medium">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {!emailParam && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#14141A]">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 h-11 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:border-[#844AFB] focus:ring-1 focus:ring-[#844AFB] outline-none"
                />
              </div>
            </div>
          )}

          {/* 6-Digit OTP Input Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14141A] block text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1}`}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-2xl font-bold bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl text-[#14141A] focus:border-[#844AFB] focus:ring-2 focus:ring-[#844AFB]/20 focus:bg-white outline-none transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* 120-Second Countdown Indicator */}
          <div className="flex items-center justify-between text-xs text-[#6B7280] px-1">
            <span className="inline-flex items-center gap-1">
              <Clock size={13} className={countdown < 30 ? 'text-[#844AFB] animate-pulse' : ''} />
              Expires in:{' '}
              <strong className={countdown < 30 ? 'text-[#844AFB] font-mono' : 'text-[#14141A] font-mono'}>
                {timeFormatted}
              </strong>
            </span>

            <button
              type="button"
              disabled={resendCooldown > 0 || resending}
              onClick={handleResend}
              className={`inline-flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                resendCooldown > 0 || resending
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-[#844AFB] hover:underline'
              }`}
            >
              <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6}
            className="w-full h-12 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </form>

        <p className="text-center text-xs text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          Wrong email or need to sign in?{' '}
          <Link href="/login" className="text-[#844AFB] font-bold hover:underline">
            Return to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F7F8]">
          <div className="p-8 text-center text-sm font-semibold text-slate-500">
            Loading verification portal...
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
