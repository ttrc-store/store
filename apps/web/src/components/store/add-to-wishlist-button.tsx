'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { addToWishlistAction, removeFromWishlistAction } from '@/actions/account';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface AddToWishlistButtonProps {
  productId: string;
  productName?: string;
  initialInWishlist?: boolean;
  className?: string;
  variant?: 'icon' | 'button';
}

export function AddToWishlistButton({
  productId,
  productName,
  initialInWishlist = false,
  className,
  variant = 'icon',
}: AddToWishlistButtonProps) {
  const [inWishlist, setInWishlist] = React.useState(initialInWishlist);
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      if (inWishlist) {
        const res = await removeFromWishlistAction(productId);
        if ('error' in res && res.error === 'Authentication required') {
          router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (!('error' in res)) {
          setInWishlist(false);
          setToast('Removed from wishlist');
        }
      } else {
        const res = await addToWishlistAction(productId);
        if ('error' in res && res.error === 'Authentication required') {
          router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (!('error' in res)) {
          setInWishlist(true);
          setToast('Saved to wishlist');
        }
      }
    } catch {
      setToast('Please sign in to save wishlist');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs',
          inWishlist
            ? 'bg-purple-50 border-purple-300 text-[#844AFB] hover:bg-purple-100'
            : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:text-[#844AFB] hover:bg-purple-50/50',
          className
        )}
      >
        <Heart
          size={16}
          className={cn(
            'transition-colors',
            inWishlist ? 'fill-[#844AFB] text-[#844AFB]' : 'text-slate-500'
          )}
        />
        <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
        {toast && (
          <span className="sr-only" role="status">
            {toast}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-label={
          inWishlist
            ? `Remove ${productName || 'product'} from wishlist`
            : `Add ${productName || 'product'} to wishlist`
        }
        className={cn(
          'p-1.5 rounded-full bg-white/95 border border-slate-200/80 hover:border-[#844AFB] text-slate-500 hover:text-[#844AFB] shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-60',
          inWishlist && 'text-[#844AFB] border-purple-300 bg-purple-50/80',
          className
        )}
      >
        <Heart
          size={14}
          className={cn(
            'transition-colors',
            inWishlist ? 'fill-[#844AFB] text-[#844AFB]' : 'text-slate-500'
          )}
        />
      </button>
      {toast && (
        <span
          className="absolute right-0 top-full mt-1 z-30 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-[#14141A] text-white shadow-md animate-in fade-in"
          role="status"
        >
          {toast}
        </span>
      )}
    </div>
  );
}
