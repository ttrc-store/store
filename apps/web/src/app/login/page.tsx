'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  Smartphone,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginAction } from '@/actions/auth';

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [identifier, setIdentifier] = React.useState('');

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    // Ensure identifier is passed as both identifier and email for complete backend compatibility
    formData.set('identifier', identifier.trim());
    formData.set('email', identifier.trim());
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8FA] text-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">
        {/* Decorative ambient accent */}
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-[#844AFB]/5 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

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
                <span>Official statutory Bills of Supply and Tax Invoices</span>
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
              Sign in using your registered Email or Mobile Number and Password.
            </p>
          </div>

          {/* OTP On Hold Notice */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
            <Info size={15} className="text-[#844AFB] shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>Notice:</strong> Mobile OTP login is temporarily on hold. Please sign in using your registered <strong>Email or Mobile Number</strong> with your password.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Unified Email or Mobile + Password Login Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-identifier" className="text-xs font-bold text-slate-700">
                  Email Address or Mobile Number
                </label>
                <span className="text-[10px] text-slate-400 font-medium">India (+91)</span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1">
                  <Mail size={15} />
                </div>
                <Input
                  id="login-identifier"
                  name="identifier"
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or 10-digit mobile number"
                  className="pl-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#844AFB] font-bold hover:underline"
                >
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
                  className="pl-10 pr-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl"
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
              className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-md shadow-purple-900/20 transition-all cursor-pointer"
            >
              <LogIn size={16} className="mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

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
