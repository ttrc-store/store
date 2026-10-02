'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
  const url = `https://wa.me/${phone}?text=Hello%20Tamizh%20Tech%20Support!%20I%20have%20an%20inquiry%20regarding%20TTRC%20Store%20products.`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-purple-700 text-white font-bold shadow-2xl hover:bg-purple-800 hover:scale-110 transition-all flex items-center gap-2 group glow-purple-sm"
      aria-label="Contact Support on WhatsApp"
    >
      <MessageCircle size={24} className="fill-black" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs whitespace-nowrap pr-1">
        WhatsApp Support
      </span>
    </a>
  );
}
