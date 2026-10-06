'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Heart,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerAction } from '@/actions/auth';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Form field states for instant client feedback
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [newsletterConsent, setNewsletterConsent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client validation
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone && phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }
    if (!termsAccepted) {
      setError('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('firstName', firstName.trim());
    formData.append('lastName', lastName.trim());
    formData.append('fullName', `${firstName.trim()} ${lastName.trim()}`.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('phone', phone.trim());
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append('termsAccepted', termsAccepted ? 'true' : 'false');
    if (redirectTo) formData.append('redirectTo', redirectTo);

    const res = await registerAction(formData);
    if (res && 'error' in res && res.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8FA] text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList className="text-xs text-slate-500">
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="hover:text-[#844AFB]">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-slate-900">
                Create Account
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden relative">
          {/* Subtle top brand glow */}
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-[#844AFB]/5 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-purple-50/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Link href="/" className="inline-block">
                  <Image
                    src="/brand/ttrc-logo.png"
                    alt="TTRC Store Logo"
                    width={130}
                    height={36}
                    priority
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <span className="text-xs font-mono font-bold text-[#844AFB] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  NEW CUSTOMER
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#050507] tracking-tight">
                Create Your TTRC Store Account
              </h1>
              <p className="text-xs text-slate-500 max-w-xl">
                Create an account to manage your robotics orders, save wishlist kits, store delivery addresses, and enjoy faster checkout.
              </p>
            </div>

            <div className="text-right sm:self-center shrink-0">
              <p className="text-xs text-slate-500">Already registered?</p>
              <Link
                href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}
                className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] hover:underline inline-flex items-center gap-1"
              >
                Sign In to Account <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700 font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="font-heading text-sm font-bold text-[#050507] uppercase tracking-wider flex items-center gap-2">
                    <User size={15} className="text-[#844AFB]" />
                    <span>Personal Details</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Your name and contact for courier dispatch and delivery.
                  </p>
                </div>

                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      placeholder="e.g. Karthik"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Last Name</label>
                    <Input
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="e.g. Raja"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Mobile Number (India)
                    </label>
                    <span className="text-[11px] text-slate-400">For SMS delivery OTP</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      +91
                    </span>
                    <Input
                      name="phone"
                      type="tel"
                      maxLength={10}
                      autoComplete="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="pl-12 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Value Props Ribbon */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2.5 text-xs text-slate-700">
                  <p className="font-bold text-[#6721F2] text-[11px] uppercase tracking-wider">
                    Customer Account Perks
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Truck size={13} className="text-[#844AFB] shrink-0" />
                      <span>Live AWB courier tracking for Tamil Nadu &amp; India</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Heart size={13} className="text-[#844AFB] shrink-0" />
                      <span>Personal wishlist with kit-to-spare compatibility</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <ShieldCheck size={13} className="text-[#844AFB] shrink-0" />
                      <span>Statutory GST tax invoices &amp; order archive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACCOUNT & SECURITY */}
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="font-heading text-sm font-bold text-[#050507] uppercase tracking-wider flex items-center gap-2">
                    <Lock size={15} className="text-[#844AFB]" />
                    <span>Account &amp; Security</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Your secure login credentials for accessing the platform.
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Min. 6 characters</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-50 border-slate-300 text-sm h-11 focus:border-[#844AFB] focus:ring-[#844AFB] rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#844AFB] transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Optional Company Profile Note */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                  <FileText size={15} className="shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    <strong>Ordering for a school, college lab or company?</strong> You can add your Company Name &amp; GSTIN anytime from your Account dashboard after signing up.
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: CONSENT & SUBMISSION */}
            <div className="pt-6 border-t border-slate-100 space-y-5">
              {/* Mandatory Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#844AFB] focus:ring-[#844AFB] w-4 h-4 cursor-pointer"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-[#844AFB] font-bold hover:underline">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" target="_blank" className="text-[#844AFB] font-bold hover:underline">
                    DPDP Act 2023 Privacy Policy
                  </Link>
                  . <span className="text-red-500">*</span>
                </span>
              </label>

              {/* Optional Marketing Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#844AFB] focus:ring-[#844AFB] w-4 h-4 cursor-pointer"
                />
                <span>
                  Keep me updated with new robotics kits, technical component releases, and engineering tutorials (Optional).
                </span>
              </label>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-900/20 glow-purple-sm transition-all"
                >
                  <UserPlus size={18} className="mr-2" />
                  {loading ? 'Creating Your Account...' : 'Create Account'}
                </Button>
              </div>

              {/* Footer Login Redirect */}
              <p className="text-center text-xs text-slate-500 pt-3">
                Already have a TTRC Store account?{' '}
                <Link
                  href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}
                  className="text-[#844AFB] font-bold hover:underline"
                >
                  Sign In here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
