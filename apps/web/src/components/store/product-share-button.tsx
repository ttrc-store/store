'use client';

import * as React from 'react';
import { Share2, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, XIcon } from '@/components/ui/brand-icons';
import { cn } from '@/lib/utils';

export interface ProductShareButtonProps {
  slug: string;
  name: string;
  pricePaise: number;
  className?: string;
  variant?: 'card' | 'detail';
}

export function ProductShareButton({
  slug,
  name,
  pricePaise,
  className,
  variant = 'card',
}: ProductShareButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const canonicalUrl = `https://www.ttrc.store/product/${slug}`;
  const formattedPrice = `₹${Math.round(pricePaise / 100).toLocaleString('en-IN')}`;
  const shareText = `Check out ${name} (${formattedPrice}) on TTRC Store:`;

  // Close on outside click or Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3200);
  };

  const copyToClipboard = async (customMessage?: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = canonicalUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast(customMessage || 'Product link copied to clipboard!');
    } catch {
      showToast('Could not copy link automatically. Please copy the URL manually.');
    }
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n${canonicalUrl}`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleShareX = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(canonicalUrl)}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleShareInstagram = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If native share sheet is available, trigger it so customer can pick Instagram Stories/DM
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `${shareText} ${formattedPrice}`,
          url: canonicalUrl,
        });
        setIsOpen(false);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: copy link and inform user
    await copyToClipboard(
      'Link copied! Instagram does not support direct browser links—paste this into your Story, DM, or Bio.'
    );
    setIsOpen(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `${shareText} ${formattedPrice}`,
          url: canonicalUrl,
        });
        setIsOpen(false);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div
      ref={dropdownRef}
      className={cn('relative inline-flex items-center', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger Button */}
      {variant === 'card' ? (
        <button
          type="button"
          onClick={handleTriggerClick}
          aria-label={`Share ${name}`}
          aria-expanded={isOpen}
          title="Share product"
          className={cn(
            'p-1.5 rounded-full transition-all duration-200 shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#844AFB]',
            isOpen
              ? 'bg-[#844AFB] text-white ring-2 ring-purple-300'
              : 'bg-white/90 backdrop-blur-xs text-slate-700 hover:text-[#844AFB] hover:bg-white border border-slate-200'
          )}
        >
          <Share2 size={13} className="stroke-[2.2]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleTriggerClick}
          aria-label={`Share ${name}`}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs"
        >
          <Share2 size={14} className="text-[#844AFB]" />
          <span>Share</span>
        </button>
      )}

      {/* Share Dropdown / Popover */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left font-sans"
        >
          <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Share Product</p>
            <p className="text-xs font-bold text-slate-900 truncate" title={name}>
              {name}
            </p>
            <p className="text-[11px] font-mono font-bold text-[#844AFB]">{formattedPrice}</p>
          </div>

          <div className="space-y-0.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              <span className="p-1 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <WhatsAppIcon className="w-3.5 h-3.5" />
              </span>
              <span>Share on WhatsApp</span>
            </button>

            {/* X (Twitter) */}
            <button
              type="button"
              onClick={handleShareX}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <span className="p-1 rounded-md bg-slate-900 text-white flex items-center justify-center">
                <XIcon className="w-3.5 h-3.5" />
              </span>
              <span>Share on X (Twitter)</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleShareInstagram}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-800 transition-colors"
            >
              <span className="p-1 rounded-md bg-pink-100 text-pink-600 flex items-center justify-center">
                <InstagramIcon className="w-3.5 h-3.5" />
              </span>
              <div className="flex flex-col text-left">
                <span>Share for Instagram</span>
                <span className="text-[9px] text-slate-400 font-normal">Sheet or Copy Link</span>
              </div>
            </button>

            {/* Native Mobile Share Sheet (if supported) */}
            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
              >
                <span className="p-1 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Smartphone size={14} />
                </span>
                <span>More Apps (Share Sheet)</span>
              </button>
            )}

            {/* Copy Link */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="p-1 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </span>
              <span className={copied ? 'text-emerald-700 font-bold' : ''}>
                {copied ? 'Copied to Clipboard!' : 'Copy Product Link'}
              </span>
            </button>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-100 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-mono truncate">ttrc.store/product/{slug}</span>
          </div>
        </div>
      )}

      {/* Floating Micro Toast Feedback */}
      {feedbackMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl bg-slate-900 text-white p-3.5 text-xs font-medium shadow-2xl border border-slate-700 flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-200"
        >
          <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-white">TTRC Store Sharing</p>
            <p className="text-slate-300 leading-snug">{feedbackMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
