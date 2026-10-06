'use client';

import * as React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface AnnouncementBarProps {
  text: string;
  link?: string;
}

export function AnnouncementBar({ text, link }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div
      role="banner"
      className="relative bg-[#1E0D45] text-white text-[11px] sm:text-xs py-2 px-4 sm:px-8 flex items-center justify-center gap-2 font-semibold tracking-wide"
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-[#AF87F8] animate-pulse flex-shrink-0"
        aria-hidden="true"
      />
      {link ? (
        <Link
          href={link}
          className="hover:text-[#AF87F8] transition-colors truncate max-w-[80vw] sm:max-w-none"
        >
          {text}
        </Link>
      ) : (
        <span className="truncate max-w-[80vw] sm:max-w-none">{text}</span>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors p-1 rounded cursor-pointer"
      >
        <X size={12} />
      </button>
    </div>
  );
}
