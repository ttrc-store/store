'use client';

/**
 * Dynamically loads the official Razorpay Checkout SDK script:
 * https://checkout.razorpay.com/v1/checkout.js
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => {
      resolve(Boolean((window as any).Razorpay));
    }, 6000);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if ((window as any).Razorpay) {
        clearTimeout(timer);
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => {
        clearTimeout(timer);
        resolve(true);
      });
      existingScript.addEventListener('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timer);
      console.error('[Razorpay] Failed to load checkout.js script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFailedResponse {
  error: {
    code: string;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

export interface RazorpayCheckoutOptions {
  key?: string;
  order_id: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
  onFailure?: (response: RazorpayPaymentFailedResponse) => void;
}

/**
 * Opens the Razorpay Standard Checkout modal for a given order.
 */
export async function launchRazorpayModal(options: RazorpayCheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw new Error('Unable to initialize Razorpay checkout. Please check your internet connection.');
  }

  const keyId = options.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error('Razorpay Key ID is not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID).');
  }

  const razorpayOptions: any = {
    key: keyId,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || 'TTRC Store',
    description: options.description || 'Robotics & Electronics Order',
    image: options.image || '/brand/ttrc-logo.png',
    order_id: options.order_id,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: options.theme?.color || '#7c3aed', // TTRC purple accent
      ...options.theme,
    },
    handler: function (response: RazorpayPaymentSuccessResponse) {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
  };

  const instance = new (window as any).Razorpay(razorpayOptions);

  if (options.onFailure) {
    instance.on('payment.failed', function (response: RazorpayPaymentFailedResponse) {
      options.onFailure?.(response);
    });
  }

  instance.open();
}
