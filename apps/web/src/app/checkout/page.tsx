'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceTag } from '@/components/store/price-tag';
import { createOrderAction } from '@/actions/checkout';
import { getSiteSettingsAction } from '@/actions/settings';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotals, clearCart } = useCartStore();
  const totals = getTotals();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [isRazorpayEnabled, setIsRazorpayEnabled] = React.useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'razorpay' | 'cod'>('cod');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSiteSettingsAction().then((settings) => {
      const hasKeys = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      if (settings.razorpay_enabled && !hasKeys) {
        console.warn(
          '[TTRC Startup Warning] razorpay_enabled setting is TRUE, but RAZORPAY_KEY_ID environment variable is missing! Automatically falling back to COD-only payment mode.'
        );
      }

      const active = settings.razorpay_enabled && hasKeys;
      setIsRazorpayEnabled(active);
      if (active) {
        setPaymentMethod('razorpay');
      } else {
        setPaymentMethod('cod');
      }
    });
  }, []);

  // Address State
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [addressLine, setAddressLine] = React.useState('');
  const [pincode, setPincode] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateName, setStateName] = React.useState('Tamil Nadu');

  const isCodDisabled = totals.totalPaise > 500000; // > ₹5,000

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    const selectedPayment = isRazorpayEnabled ? paymentMethod : 'cod';

    const res = await createOrderAction({
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      paymentMethod: selectedPayment,
      shippingAddress: {
        fullName,
        phone,
        line1: addressLine,
        city,
        state: stateName,
        pincode,
      },
      stateCode: '33',
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const orderNum = res.orderNumber || 'TTRC/25-26/100001';

    if (res.paymentMethod === 'razorpay' && isRazorpayEnabled) {
      // Simulate Razorpay Payment Success Modal trigger
      setTimeout(() => {
        clearCart();
        router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNum)}`);
      }, 800);
    } else {
      clearCart();
      router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNum)}`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-md shadow-purple-900/20">
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
          Checkout &amp; Place Order
        </h1>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-600 mb-6">
            <AlertCircle size={18} className="flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Steps Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Address */}
            <div className={`p-6 rounded-2xl border transition-colors ${step === 1 ? 'bg-white border-purple-600 shadow-md' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                  <MapPin className="text-purple-700" size={20} />
                  Step 1: Shipping Address
                </h2>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-purple-700 hover:underline">
                    Edit Address
                  </button>
                )}
              </div>

              {step === 1 ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Full Name *</label>
                      <Input placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:ring-red-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Phone Number *</label>
                      <Input placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:ring-red-600" />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-slate-700">Street Address *</label>
                      <Input placeholder="House/Flat no., building, street, area" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:ring-red-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Pincode *</label>
                      <Input placeholder="6-digit PIN code" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} className="bg-slate-50 border-slate-300 h-10 font-mono rounded-xl focus:ring-red-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">City *</label>
                      <Input placeholder="City / Town" value={city} onChange={(e) => setCity(e.target.value)} className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:ring-red-600" />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (!fullName.trim() || !phone.trim() || !addressLine.trim() || !pincode.trim() || !city.trim()) {
                        setError('Please fill in all required shipping address fields.');
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                    className="bg-red-600 text-white font-bold text-xs hover:bg-red-700 rounded-xl"
                  >
                    Continue to Payment
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p className="font-bold text-slate-900">{fullName} ({phone})</p>
                  <p>{addressLine}, {city}, {stateName} — {pincode}</p>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className={`p-6 rounded-2xl border transition-colors ${step === 2 ? 'bg-white border-purple-600 shadow-md' : 'bg-white border-slate-200'}`}>
              <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 mb-4">
                <CreditCard className="text-purple-700" size={20} />
                Step 2: Choose Payment Method
              </h2>

              <div className="space-y-3">
                {/* Razorpay Option (Only rendered if enabled via config) */}
                {isRazorpayEnabled && (
                  <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'bg-purple-50 border-purple-600' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-purple-700"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Razorpay Online Payment (Instant Confirmation)</p>
                        <p className="text-xs text-slate-500">UPI (GPay, PhonePe, Paytm), NetBanking, All Credit/Debit Cards</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full">Recommended</span>
                  </label>
                )}

                {/* Cash on Delivery Option */}
                <label className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isCodDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : paymentMethod === 'cod' ? 'bg-purple-50 border-purple-600 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-pointer'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      disabled={isCodDisabled}
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-purple-700"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</p>
                      <p className="text-xs text-slate-500">
                        {isCodDisabled ? 'Unavailable for orders above ₹5,000' : 'Pay in cash upon delivery to courier agent'}
                      </p>
                    </div>
                  </div>
                  {isCodDisabled && <span className="text-[11px] text-red-600 font-bold">Limit Exceeded</span>}
                </label>
              </div>

              {step === 2 && (
                <div className="pt-6">
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full h-12 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/20"
                  >
                    {loading ? 'Processing Order...' : (paymentMethod === 'razorpay' && isRazorpayEnabled) ? 'Pay Now with Razorpay' : 'Confirm Cash on Delivery Order'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-md">
              <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-200 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                {items.map((i) => (
                  <div key={i.id} className="pt-2 flex items-center justify-between">
                    <div className="pr-2">
                      <p className="font-bold text-slate-900 line-clamp-1">{i.name}</p>
                      <p className="text-slate-500">Qty: {i.quantity}</p>
                    </div>
                    <PriceTag pricePaise={i.pricePaise * i.quantity} size="sm" />
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs pt-4 border-t border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <PriceTag pricePaise={totals.subtotalPaise} size="sm" />
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{totals.isFreeShipping ? 'FREE' : `₹${(totals.shippingPaise / 100).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <PriceTag pricePaise={totals.totalPaise} size="default" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
