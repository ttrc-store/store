'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Phone, CheckCircle2, ArrowRight, ShieldCheck, Truck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginAction } from '@/actions/auth';

export default function LoginPage() {
  const [authMode, setAuthMode] = React.useState<'password' | 'otp'>('password');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // OTP state
  const [otpPhone, setOtpPhone] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [otpTimer, setOtpTimer] = React.useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = otpPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError(null);
    setOtpSent(true);
    setOtpTimer(30);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setError('SMS Gateway integration is pending production carrier setup. Please log in using your registered Email & Password.');
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8FA] text-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">
        {/* Decorative ambient accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#844AFB]/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        {/* LEFT COLUMN: New Customer Onboarding (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1E0D45] to-[#2F146B] text-white p-8 md:p-10 flex flex-col justify-between relative order-2 md:order-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#AF87F8]">
                New to TTRC Store?
              </span>
              <h2 className="font-heading text-2xl font-bold text-white tracking-tight">
                Create Your Account
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join India&apos;s leading STEM and robotics community to manage orders, track shipments, and access student &amp; maker benefits.
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-200">
              <li className="flex items-start gap-2.5">
                <Truck size={16} className="text-[#AF87F8] shrink-0 mt-0.5" />
                <span>Express courier tracking and live shipment updates</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Heart size={16} className="text-[#AF87F8] shrink-0 mt-0.5" />
                <span>Save robotics kits &amp; spare parts to your personal wishlist</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#AF87F8] shrink-0 mt-0.5" />
                <span>Official statutory GST tax invoices and download receipts</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link href="/register" className="block">
              <Button
                variant="outline"
                className="w-full h-11 bg-white/10 hover:bg-white text-white hover:text-[#1E0D45] border-white/30 font-bold text-xs rounded-xl transition-all"
              >
                Create an Account <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Returning Customer Sign In (7 cols) */}
        <div className="md:col-span-7 p-8 md:p-10 space-y-6 order-1 md:order-2 bg-white">
          {/* Header */}
          <div className="space-y-2">
            <Link href="/" className="inline-block mb-1">
              <Image
                src="/brand/ttrc-logo.png"
                alt="TTRC Store Logo"
                width={130}
                height={36}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
            <h1 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Returning Customer
            </h1>
            <p className="text-xs text-slate-500">
              Sign in to manage your orders, saved addresses, and active wishlist.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'password'
                  ? 'bg-white text-[#844AFB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email &amp; Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'otp'
                  ? 'bg-white text-[#844AFB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login with Mobile OTP
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Login Form */}
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="login-email" className="text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="pl-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[11px] text-[#844AFB] font-bold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#844AFB] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-md shadow-purple-900/20 transition-all"
              >
                <LogIn size={16} className="mr-2" />
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            /* Mobile OTP Login Form */
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Mobile Number (India)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        +91
                      </span>
                      <Input
                        type="tel"
                        maxLength={10}
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="pl-12 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] font-mono tracking-wider"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      We will send a 6-digit one-time code to verify your phone number.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={otpPhone.length !== 10}
                    className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-md shadow-purple-900/20"
                  >
                    Send One-Time Password (OTP)
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-[#844AFB] hover:underline"
                      >
                        Change number
                      </button>
                    </div>
                    <Input
                      type="text"
                      maxLength={6}
                      autoFocus
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="text-center font-mono text-lg tracking-widest h-12 bg-slate-50 border-slate-300 focus:border-[#844AFB] focus:ring-[#844AFB]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Code sent to +91 ******{otpPhone.slice(-4)}</span>
                      {otpTimer > 0 ? (
                        <span className="font-mono text-slate-400">Resend in {otpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOtpTimer(30)}
                          className="font-bold text-[#844AFB] hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-md shadow-purple-900/20"
                  >
                    Verify &amp; Sign In
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Mobile visible signup link */}
          <div className="md:hidden text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              New to TTRC Store?{' '}
              <Link href="/register" className="text-[#844AFB] font-bold hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
