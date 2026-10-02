'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, MessageSquare } from 'lucide-react';
import { RatingStars } from '@/components/store/rating-stars';
import { Button } from '@/components/ui/button';
import { getMyReviewsAction } from '@/actions/account';

export default function AccountReviewsPage() {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadReviews = React.useCallback(async () => {
    setLoading(true);
    const res = await getMyReviewsAction();
    if ('reviews' in res) {
      setReviews(res.reviews ?? []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
          <Star className="text-red-600" size={22} />
          My Product Reviews
        </h2>
        <p className="text-xs text-slate-500">Reviews you have published as a verified buyer</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading your product reviews...</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-red-200 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/product/${rev.productSlug}`} className="font-bold text-sm text-slate-900 hover:text-red-600">
                    {rev.productName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={rev.rating} size="sm" />
                    <span className="text-[11px] text-slate-500">Reviewed on {rev.date}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} /> {rev.status}
                </span>
              </div>

              <p className="text-xs font-bold text-slate-900">{rev.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{rev.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
            <MessageSquare size={22} />
          </div>
          <h3 className="font-heading text-base font-bold text-slate-900">No Product Reviews Yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Once you receive your robotics kits and components, share your feedback with the builder community!
          </p>
          <Link href="/account/orders">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-sm mt-2">
              View Delivered Orders
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
