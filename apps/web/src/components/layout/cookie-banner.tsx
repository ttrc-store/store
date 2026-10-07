'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';

export function CookieBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const consent = localStorage.getItem('ttrc_cookie_consent');
    if (!consent) {
      queueMicrotask(() => setShow(true));
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ttrc_cookie_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('ttrc_cookie_consent', 'essential_only');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-36 left-3 right-3 sm:bottom-36 md:bottom-6 md:left-6 md:right-auto md:max-w-md z-40 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-50 text-[#844AFB] shrink-0 mt-0.5">
            <Cookie size={16} />
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            We use essential cookies for session auth &amp; cart tracking, and optional analytics cookies to improve your shopping experience per the{' '}
            <Link href="/privacy-policy" className="text-[#844AFB] underline font-semibold hover:text-[#6721F2] transition-colors">
              DPDP Act 2023 Policy
            </Link>.
          </p>
        </div>
        <button
          onClick={handleDecline}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss cookie banner"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={handleDecline}
          className="text-slate-500 hover:text-slate-800 text-[11px] font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Essential Only
        </button>
        <Button
          onClick={handleAccept}
          className="bg-[#844AFB] text-white hover:bg-[#6721F2] font-bold text-xs h-8 px-4 shadow-sm rounded-xl transition-all cursor-pointer"
        >
          Accept &amp; Continue
        </Button>
      </div>
    </div>
  );
}

