'use client';

import * as React from 'react';
import { RefreshCw, XCircle, Star, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cancelMyOrderAction, requestReturnAction } from '@/actions/orders';
import { submitReviewAction } from '@/actions/account';
import { useCartStore } from '@/store/use-cart';
import { useRouter } from 'next/navigation';

interface OrderActionsModalProps {
  orderId: string;
  orderNumber: string;
  status: string;
  items?: Array<{
    productId?: string;
    product_id?: string;
    name: string;
    quantity: number;
    pricePaise?: number;
    price?: number;
  }>;
}

export function OrderActionsModal({
  orderId,
  orderNumber,
  status,
  items = [],
}: OrderActionsModalProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [activeDialog, setActiveDialog] = React.useState<
    'none' | 'cancel' | 'return' | 'review'
  >('none');
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ text: string; isError: boolean } | null>(null);

  // Form states
  const [cancelReason, setCancelReason] = React.useState('');
  const [returnReason, setReturnReason] = React.useState('');
  const [reviewProductId, setReviewProductId] = React.useState(
    items[0]?.productId || items[0]?.product_id || ''
  );
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState('');
  const [reviewComment, setReviewComment] = React.useState('');

  const isCancellable = ['confirmed', 'processing', 'pending_payment'].includes(status);
  const isDelivered = status === 'delivered';

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await cancelMyOrderAction({
        orderId,
        reason: cancelReason,
      });
      if (res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({
          text: res.message || 'Order cancelled successfully.',
          isError: false,
        });
        setTimeout(() => {
          setActiveDialog('none');
          router.refresh();
        }, 1800);
      }
    } catch {
      setFeedback({ text: 'Failed to cancel order. Please try again.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await requestReturnAction({
        orderId,
        reason: returnReason,
      });
      if (res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({
          text: res.message || 'Return request submitted.',
          isError: false,
        });
        setTimeout(() => {
          setActiveDialog('none');
          router.refresh();
        }, 2000);
      }
    } catch {
      setFeedback({ text: 'Failed to submit return request.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId || !reviewComment.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await submitReviewAction({
        productId: reviewProductId,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      if (res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({
          text: 'Thank you! Your verified review has been published.',
          isError: false,
        });
        setTimeout(() => {
          setActiveDialog('none');
          router.refresh();
        }, 1800);
      }
    } catch {
      setFeedback({ text: 'Failed to submit review.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = () => {
    items.forEach((item) => {
      const pId = item.productId || item.product_id;
      if (pId) {
        addItem({
          id: pId,
          slug: pId,
          name: item.name,
          pricePaise: item.pricePaise || item.price || 0,
          imageUrl: '/brand/ttrc-logo.png',
          quantity: item.quantity || 1,
          gstPercent: 18,
          stockQty: 20,
          productType: 'standard',
        });
      }
    });
    router.push('/cart');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Reorder Button */}
      {items.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleReorder}
          className="h-8 text-xs border-purple-200 text-[#844AFB] hover:bg-purple-50 font-bold rounded-xl cursor-pointer"
        >
          <ShoppingBag size={13} className="mr-1" />
          Reorder
        </Button>
      )}

      {/* Cancel Order Button */}
      {isCancellable && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFeedback(null);
            setActiveDialog('cancel');
          }}
          className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl cursor-pointer"
        >
          <XCircle size={13} className="mr-1" />
          Cancel Order
        </Button>
      )}

      {/* Return Request Button */}
      {isDelivered && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFeedback(null);
            setActiveDialog('return');
          }}
          className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
        >
          <RefreshCw size={13} className="mr-1" />
          Request Return
        </Button>
      )}

      {/* Write Review Button */}
      {isDelivered && items.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFeedback(null);
            setActiveDialog('review');
          }}
          className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 font-bold rounded-xl cursor-pointer"
        >
          <Star size={13} className="mr-1" />
          Write Review
        </Button>
      )}

      {/* Modal Dialog Overlay */}
      {activeDialog !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.isError
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {feedback.isError ? (
                  <AlertCircle size={16} className="shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Cancel Order Form */}
            {activeDialog === 'cancel' && (
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Cancel Order {orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to cancel this order? Reserved stock will be returned to inventory.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-700">Reason for Cancellation (Optional)</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Need to change shipping address">Need to change shipping address</option>
                    <option value="Found alternative robotics kit">Found alternative robotics kit</option>
                    <option value="Delivery timeline too long">Delivery timeline too long</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveDialog('none')}
                    disabled={loading}
                    className="text-xs rounded-xl"
                  >
                    Keep Order
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                  >
                    {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                  </Button>
                </div>
              </form>
            )}

            {/* Return Request Form */}
            {activeDialog === 'return' && (
              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Request 7-Day Replacement / Return
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Order {orderNumber} • Under TTRC 7-Day Replacement Policy for transit or manufacturing defects.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-700">Reason for Return / Issue Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Describe the non-working or damaged component (e.g. motor shaft bent on arrival, microcontroller defective)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#844AFB]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveDialog('none')}
                    disabled={loading}
                    className="text-xs rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !returnReason.trim()}
                    className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl"
                  >
                    {loading ? 'Submitting...' : 'Submit Return Request'}
                  </Button>
                </div>
              </form>
            )}

            {/* Write Review Form */}
            {activeDialog === 'review' && (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Submit Verified Buyer Review
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Share genuine performance feedback with competition robotics builders.
                  </p>
                </div>

                {items.length > 1 && (
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">Select Item</label>
                    <select
                      value={reviewProductId}
                      onChange={(e) => setReviewProductId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    >
                      {items.map((it) => (
                        <option
                          key={it.productId || it.product_id}
                          value={it.productId || it.product_id}
                        >
                          {it.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setReviewRating(s)}
                        className="p-1 cursor-pointer"
                        title={`${s} Star${s > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={22}
                          className={
                            s <= reviewRating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {reviewRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Review Headline</label>
                  <Input
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Excellent line follower chassis build quality"
                    className="bg-slate-50 border-slate-200 h-9 text-xs"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Review Comments *</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How did the kit or part perform during testing and robotics competitions?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#844AFB]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveDialog('none')}
                    disabled={loading}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !reviewComment.trim()}
                    className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl"
                  >
                    {loading ? 'Submitting...' : 'Post Verified Review'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
