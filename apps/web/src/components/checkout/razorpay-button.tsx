'use client';

import * as React from 'react';
import { launchRazorpayModal } from '@/lib/razorpay-client';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

export interface RazorpayButtonProps {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  label?: string;
  className?: string;
  onSuccess?: (verificationResult: any) => void;
  onError?: (errorMsg: string) => void;
  disabled?: boolean;
}

export function RazorpayButton({
  amountPaise,
  currency = 'INR',
  receipt,
  prefill,
  notes,
  label = 'Pay with Razorpay',
  className,
  onSuccess,
  onError,
  disabled = false,
}: RazorpayButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // STEP 1: Call Backend to Create Order (Isolated developer test flag)
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          isDevTest: true,
          notes,
        }),
      });

      const orderData = await createOrderRes.json();
      if (!createOrderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment order with Razorpay.');
      }

      // STEP 2: Open Razorpay Checkout Modal
      await launchRazorpayModal({
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TTRC Store',
        description: 'Tamizh Tech Robotics & Electronics Payment',
        prefill,
        notes,
        onSuccess: async (response) => {
          // STEP 3: Verify Payment Signature via Backend
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber: receipt,
                isDevTest: true,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              const errMsg = verifyData.error || 'Payment signature verification failed.';
              setError(errMsg);
              onError?.(errMsg);
              return;
            }

            onSuccess?.(verifyData);
          } catch (verifyErr: any) {
            const errMsg = verifyErr.message || 'Error communicating with verification server.';
            setError(errMsg);
            onError?.(errMsg);
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => {
          setLoading(false);
          setError('Payment window was closed before completion.');
          onError?.('Payment window closed.');
        },
        onFailure: (failedRes) => {
          setLoading(false);
          const errMsg = failedRes.error.description || 'Payment was declined or failed.';
          setError(errMsg);
          onError?.(errMsg);
        },
      });
    } catch (err: any) {
      setLoading(false);
      const errMsg = err.message || 'An error occurred during payment initialization.';
      setError(errMsg);
      onError?.(errMsg);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handlePayment}
        disabled={disabled || loading}
        className={className || 'w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 flex items-center justify-center gap-2 rounded-xl'}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
