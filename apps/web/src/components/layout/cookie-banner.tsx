'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl text-xs space-y-3">
      <p className="text-slate-600 leading-relaxed">
        We use essential cookies for session auth &amp; cart tracking, and optional analytics cookies to improve your shopping experience per the <Link href="/privacy-policy" className="text-[#844AFB] underline font-semibold">DPDP Act 2023 Policy</Link>.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleAccept} className="bg-[#844AFB] text-white hover:bg-[#6721F2] font-bold text-xs h-8 px-4 shadow-sm rounded-xl">
          Accept &amp; Continue
        </Button>
      </div>
    </div>
  );
}
