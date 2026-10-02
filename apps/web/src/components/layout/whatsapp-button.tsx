'use client';

import * as React from 'react';
import { WhatsAppIcon, InstagramIcon } from '@/components/ui/brand-icons';

export function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917904902978';
  const whatsappUrl = `https://wa.me/${phone}?text=Hello%20Tamizh%20Tech%20Support!%20I%20have%20an%20inquiry%20regarding%20TTRC%20Store%20products.`;
  const instagramUrl = 'https://www.instagram.com/ttrc.store/';

  return (
    <div className="fixed bottom-20 md:bottom-6 right-5 z-40 flex flex-col items-end gap-2.5">
      {/* Instagram Official Floating Button */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg hover:scale-110 transition-all flex items-center justify-center group"
        aria-label="Follow TTRC Store on Instagram"
      >
        <InstagramIcon className="w-5 h-5 text-white" />
      </a>

      {/* WhatsApp Official Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="h-12 px-3.5 rounded-full bg-[#25D366] text-white font-bold shadow-xl hover:bg-[#20ba5a] hover:scale-105 transition-all flex items-center gap-2 group shadow-emerald-900/20"
        aria-label="Contact Support on WhatsApp"
      >
        <WhatsAppIcon className="w-6 h-6 text-white flex-shrink-0" />
        <span className="hidden sm:inline-block text-xs font-semibold pr-1">
          Chat on WhatsApp
        </span>
      </a>
    </div>
  );
}
