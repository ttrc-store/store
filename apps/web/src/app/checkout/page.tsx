'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Edit2,
  Tag,
  Lock,
  User,
  LogIn,
  Package,
  Building,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { useCartStore } from '@/store/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceTag } from '@/components/store/price-tag';
import { createOrderAction, validateCouponAction } from '@/actions/checkout';
import { getSiteSettingsAction } from '@/actions/settings';
import { getAccountOverviewAction, getAddressesAction } from '@/actions/account';
import { launchRazorpayModal, loadRazorpayScript } from '@/lib/razorpay-client';
import { IUserAddress } from '@/lib/mongodb/models';

// Map Indian states to 2-digit GST state codes
const STATE_CODE_MAP: Record<string, string> = {
  'Tamil Nadu': '33',
  'Karnataka': '29',
  'Kerala': '32',
  'Andhra Pradesh': '37',
  'Telangana': '36',
  'Maharashtra': '27',
  'Delhi': '07',
  'Gujarat': '24',
  'Uttar Pradesh': '09',
  'West Bengal': '19',
  'Rajasthan': '08',
  'Haryana': '06',
  'Punjab': '03',
  'Madhya Pradesh': '23',
  'Bihar': '10',
  'Odisha': '21',
  'Goa': '30',
  'Assam': '18',
  'Jharkhand': '20',
  'Chhattisgarh': '22',
  'Uttarakhand': '05',
  'Himachal Pradesh': '02',
};

interface PincodeCheckResult {
  pincode: string;
  isServiceable: boolean;
  city: string;
  state: string;
  estimatedDays: string;
  courierName: string;
  codAvailable: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotals, clearCart, couponCode, discountPaise, setCoupon, removeCoupon } = useCartStore();
  const totals = getTotals();

  // Authentication & Gate State
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [hasChosenGuest, setHasChosenGuest] = React.useState(false);
  const [savedAddresses, setSavedAddresses] = React.useState<IUserAddress[]>([]);
  const [selectedSavedAddrId, setSelectedSavedAddrId] = React.useState<string | null>(null);

  // Workflow Steps: 1 = Address, 2 = Shipping / Dispatch, 3 = Review & Payment
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Payment gateway settings
  const [isRazorpayEnabled, setIsRazorpayEnabled] = React.useState<boolean>(false);
  const [razorpayKey, setRazorpayKey] = React.useState<string>('');
  const paymentMethod = 'razorpay' as const;
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1: Contact & Address State
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [addressLine1, setAddressLine1] = React.useState('');
  const [addressLine2, setAddressLine2] = React.useState('');
  const [pincode, setPincode] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateName, setStateName] = React.useState('Tamil Nadu');

  // Pincode validation state
  const [pincodeChecking, setPincodeChecking] = React.useState(false);
  const [pincodeResult, setPincodeResult] = React.useState<PincodeCheckResult | null>(null);
  const [pincodeError, setPincodeError] = React.useState<string | null>(null);

  // Billing address toggle
  const [billingSameAsShipping, setBillingSameAsShipping] = React.useState(true);
  const [billingFullName, setBillingFullName] = React.useState('');
  const [billingPhone, setBillingPhone] = React.useState('');
  const [billingLine1, setBillingLine1] = React.useState('');
  const [billingLine2, setBillingLine2] = React.useState('');
  const [billingCity, setBillingCity] = React.useState('');
  const [billingState, setBillingState] = React.useState('Tamil Nadu');
  const [billingPincode, setBillingPincode] = React.useState('');

  // Business GST Invoice (Optional)
  const [showGstForm, setShowGstForm] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [gstin, setGstin] = React.useState('');
  const [gstError, setGstError] = React.useState<string | null>(null);

  // Step 2: Shipping method selection
  const [shippingMethod, setShippingMethod] = React.useState<'standard' | 'express'>('standard');
  const [freeShippingThresholdPaise, setFreeShippingThresholdPaise] = React.useState(99900);
  const [baseShippingPaise, setBaseShippingPaise] = React.useState(5900);

  // Coupon Input State
  const [couponInput, setCouponInput] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponMessage, setCouponMessage] = React.useState<{ text: string; isError: boolean } | null>(null);

  // Real-time Pincode Verification via Server API
  const verifyPincode = React.useCallback(async (code: string) => {
    if (!/^\d{6}$/.test(code)) {
      setPincodeResult(null);
      setPincodeError('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    setPincodeChecking(true);
    setPincodeError(null);

    try {
      const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setPincodeError(data.error || 'PIN code check failed.');
        setPincodeResult(null);
      } else {
        setPincodeResult(data);
        if (data.city) setCity((prev) => prev || data.city);
        if (data.state) setStateName(data.state);
        setPincodeError(null);
      }
    } catch {
      setPincodeError('Network error checking PIN code.');
    } finally {
      setPincodeChecking(false);
    }
  }, []);

  // Address selection helper
  const selectAddress = React.useCallback((addr: IUserAddress) => {
    setSelectedSavedAddrId(addr.id ? String(addr.id) : null);
    const parts = addr.fullName.trim().split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setPhone(addr.phone || '');
    setAddressLine1(addr.line1 || '');
    setAddressLine2(addr.line2 || '');
    setCity(addr.city || '');
    setStateName(addr.state || 'Tamil Nadu');
    setPincode(addr.pincode || '');
    if (addr.pincode && addr.pincode.length === 6) {
      verifyPincode(addr.pincode);
    }
  }, [verifyPincode]);

  // Load user profile & saved addresses on mount
  React.useEffect(() => {
    let mounted = true;

    async function initCheckout() {
      try {
        const [settings, accountData, addressesData] = await Promise.all([
          getSiteSettingsAction(),
          getAccountOverviewAction(),
          getAddressesAction(),
        ]);

        if (!mounted) return;

        // Settings
        setFreeShippingThresholdPaise(settings.free_shipping_threshold_paise || 99900);
        setBaseShippingPaise(settings.base_shipping_paise || 5900);

        const keyId = settings.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
        setRazorpayKey(keyId);
        const hasKeys = Boolean(keyId);
        const active = Boolean(settings.razorpay_enabled && hasKeys);
        setIsRazorpayEnabled(active);

        // Authentication status
        if (accountData && !accountData.error && accountData.profile) {
          setIsAuthenticated(true);
          setEmail(accountData.profile.email || '');
          if (accountData.profile.phone) setPhone(accountData.profile.phone);
          if (accountData.profile.fullName) {
            const parts = accountData.profile.fullName.trim().split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }

          if (addressesData && addressesData.addresses && addressesData.addresses.length > 0) {
            setSavedAddresses(addressesData.addresses);
            const defaultAddr = addressesData.addresses.find((a) => a.isDefault) || addressesData.addresses[0];
            if (defaultAddr) {
              selectAddress(defaultAddr);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('[Checkout] Init load warning:', err);
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    }

    initCheckout();
    return () => {
      mounted = false;
    };
  }, [selectAddress]);

  // Preload Razorpay Checkout Script when reaching Payment step
  React.useEffect(() => {
    if (step === 3 && isRazorpayEnabled) {
      loadRazorpayScript().catch(() => {});
    }
  }, [step, isRazorpayEnabled]);

  // GST validation
  const validateGst = (val: string) => {
    if (!val) return true;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(val.toUpperCase().trim());
  };

  // Step 1 -> Step 2 validation
  const handleProceedToShipping = () => {
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid contact email address.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit Indian phone number.');
      return;
    }

    if (!firstName.trim()) {
      setError('Please provide your First Name.');
      return;
    }

    if (!addressLine1.trim()) {
      setError('Please enter your House/Flat no. and Street Address.');
      return;
    }

    if (!pincode.trim() || !/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    if (!city.trim()) {
      setError('Please enter your City or Town.');
      return;
    }

    if (!billingSameAsShipping) {
      if (!billingFullName.trim() || !billingLine1.trim() || !billingCity.trim() || !billingPincode.trim()) {
        setError('Please complete all required billing address fields.');
        return;
      }
    }

    if (showGstForm) {
      if (!companyName.trim()) {
        setError('Please enter your registered Company/Business Name.');
        return;
      }
      if (!validateGst(gstin)) {
        setError('Invalid 15-character GSTIN format. Example: 33ABCDE1234F1Z5');
        return;
      }
    }

    setStep(2);
  };

  // Step 2 -> Step 3
  const handleProceedToReview = () => {
    setError(null);
    setStep(3);
  };

  // Coupon handling
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await validateCouponAction(couponInput.trim(), totals.subtotalPaise);
      if (res.error) {
        setCouponMessage({ text: res.error, isError: true });
      } else if (res.success && res.discountPaise !== undefined) {
        setCoupon(couponInput.trim(), res.discountPaise);
        setCouponMessage({
          text: res.message || `Coupon applied! You save ₹${(res.discountPaise / 100).toFixed(2)}.`,
          isError: false,
        });
        setCouponInput('');
      }
    } catch {
      setCouponMessage({ text: 'Failed to apply coupon. Please try again.', isError: true });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage(null);
  };

  // Calculate dynamic shipping cost (standard delivery applied across all orders, no free shipping)
  const isEligibleForFreeShipping = false;
  const standardShippingCost = baseShippingPaise || 5900;
  const expressShippingCost = 9900;
  const selectedShippingPaise = shippingMethod === 'express' ? expressShippingCost : standardShippingCost;

  // Calculate GST added to total bill
  const isIntraState = stateName === 'Tamil Nadu';
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;

  for (const item of items) {
    const gstPercent = Number(item.gstPercent || 18);
    const lineTax = Math.round((item.pricePaise * item.quantity * gstPercent) / 100);
    if (isIntraState) {
      const half = Math.round(lineTax / 2);
      totalCgstPaise += half;
      totalSgstPaise += (lineTax - half);
    } else {
      totalIgstPaise += lineTax;
    }
  }
  const totalTaxPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise;

  // Final Payable Calculation: Subtotal + Shipping + GST - Discount
  const finalPayablePaise = Math.max(
    0,
    totals.subtotalPaise - (discountPaise || 0) + selectedShippingPaise + totalTaxPaise
  );

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      setError('Please agree to the Terms of Service & Privacy Policy before placing your order.');
      return;
    }

    if (!isRazorpayEnabled) {
      setError('Online payment is temporarily unavailable. Please try again shortly or contact support@ttrc.store.');
      return;
    }

    setLoading(true);
    setError(null);

    const resolvedStateCode = STATE_CODE_MAP[stateName] || '33';
    const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();

    const orderPayload = {
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      paymentMethod: 'razorpay',
      guestEmail: !isAuthenticated ? email.toLowerCase().trim() : undefined,
      shippingAddress: {
        fullName: fullNameCombined,
        phone: phone.replace(/\D/g, ''),
        line1: addressLine1.trim(),
        line2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      },
      billingAddress: !billingSameAsShipping
        ? {
            fullName: billingFullName.trim(),
            phone: (billingPhone || phone).replace(/\D/g, ''),
            line1: billingLine1.trim(),
            line2: billingLine2.trim() || undefined,
            city: billingCity.trim(),
            state: billingState.trim(),
            pincode: billingPincode.trim(),
          }
        : undefined,
      stateCode: resolvedStateCode,
      couponCode: couponCode || undefined,
      companyGst:
        showGstForm && gstin.trim()
          ? {
              companyName: companyName.trim(),
              gstin: gstin.toUpperCase().trim(),
            }
          : undefined,
    };

    const res = await createOrderAction(orderPayload);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const orderNum = res.orderNumber || 'TTRC/25-26/100001';

    // Online Razorpay Flow
    if (res.paymentMethod === 'razorpay' && isRazorpayEnabled) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        let orderRes: Response;
        try {
          orderRes = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              orderNumber: orderNum,
              orderId: res.orderId,
              guestEmail: !isAuthenticated ? email.toLowerCase().trim() : undefined,
            }),
          });
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            throw new Error('Payment gateway took too long to respond. Please verify your Razorpay API keys or network connection.');
          }
          throw fetchErr;
        } finally {
          clearTimeout(timeoutId);
        }

        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.order_id) {
          throw new Error(orderData.error || 'Failed to initialize payment gateway.');
        }

        await launchRazorpayModal({
          key: razorpayKey || undefined,
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'TTRC Store',
          description: `Order ${orderNum}`,
          prefill: {
            name: fullNameCombined,
            email: email,
            contact: phone,
          },
          theme: {
            color: '#844AFB',
          },
          notes: {
            orderNumber: orderNum,
          },
          onSuccess: async (payResponse) => {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: payResponse.razorpay_order_id,
                  razorpay_payment_id: payResponse.razorpay_payment_id,
                  razorpay_signature: payResponse.razorpay_signature,
                  orderNumber: orderNum,
                  guestEmail: !isAuthenticated ? email.toLowerCase().trim() : undefined,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.verified) {
                setError(verifyData.error || 'Payment verification failed. Please contact support.');
                setLoading(false);
                return;
              }

              clearCart();
              router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNum)}`);
            } catch (err: any) {
              setError(err.message || 'Error communicating with payment verification service.');
              setLoading(false);
            }
          },
          onDismiss: () => {
            setLoading(false);
            setError('Payment window was closed. You can retry paying with Razorpay at any time.');
          },
          onFailure: (failedRes) => {
            setLoading(false);
            setError(failedRes.error.description || 'Payment was declined by payment gateway.');
          },
        });
      } catch (payInitErr: any) {
        setLoading(false);
        setError(payInitErr.message || 'Failed to initialize payment window.');
      }
    } else {
      setLoading(false);
      setError('Online payment via Razorpay is the only accepted payment method.');
    }
  };

  // Cart Empty State
  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] bg-[#FDFDFD] text-[#050507] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EEE8FA] flex items-center justify-center text-[#844AFB] mb-2">
          <Package size={32} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#050507]">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Explore our robotics kits, STEM components, and precision fasteners to start building.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[#844AFB] text-white font-bold text-sm hover:bg-[#6721F2] transition-colors shadow-md shadow-[#844AFB]/20"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  // Auth Gate: Unauthenticated customers choose Guest vs Sign In
  const showAuthGate = !isAuthChecking && !isAuthenticated && !hasChosenGuest;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#050507] pb-24 pt-6 sm:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Secure Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#844AFB] bg-[#EEE8FA] px-2.5 py-0.5 rounded-full">
                TTRC Official Store
              </span>
              <span className="text-xs text-slate-500">Tamizh Tech Robotics Company</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#050507]">
              Secure Checkout
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Lock size={15} />
              <span>256-bit SSL Encrypted</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-[#844AFB] font-semibold">
              <ShieldCheck size={15} />
              <span>100% Genuine Robotics</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-600 mb-6 animate-in fade-in">
            <AlertCircle size={18} className="flex-shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* CHECKOUT ENTRY GATE: Shown only if not authenticated and hasn't picked guest yet */}
        {showAuthGate ? (
          <div className="max-w-3xl mx-auto py-8">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-[#050507]">How would you like to checkout?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose guest checkout for speed, or sign in to access your saved addresses and order history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Continue as Guest */}
              <div className="p-6 rounded-2xl bg-white border-2 border-[#844AFB] shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center mb-4">
                    <User size={24} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-lg font-bold text-[#050507]">Continue as Guest</h3>
                    <span className="text-[10px] font-bold text-[#844AFB] bg-[#EEE8FA] px-2 py-0.5 rounded-full uppercase">
                      Fast Track
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    No password required. Enter your email for order tracking, receipt delivery, and live dispatch updates.
                  </p>

                  <div className="space-y-1.5 mb-6">
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setError('Please enter a valid email address to proceed as guest.');
                      return;
                    }
                    setError(null);
                    setHasChosenGuest(true);
                  }}
                  className="w-full h-11 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-md shadow-[#844AFB]/20 flex items-center justify-center gap-2"
                >
                  <span>Continue to Address</span>
                  <ArrowRight size={15} />
                </Button>
              </div>

              {/* Option B: Sign In / Register */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#844AFB] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                    <LogIn size={24} />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#050507] mb-2">Sign In / Register</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Access your saved addresses, track previous kit orders, download official GST tax invoices, and earn rewards.
                  </p>

                  <ul className="text-xs text-slate-600 space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#844AFB]" />
                      <span>One-click saved address autofill</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#844AFB]" />
                      <span>Order history &amp; warranty verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#844AFB]" />
                      <span>Your cart is automatically preserved</span>
                    </li>
                  </ul>
                </div>

                <Link href="/login?redirectTo=/checkout" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-slate-300 hover:border-[#844AFB] hover:bg-[#EEE8FA] text-[#050507] font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    <span>Log In to Account</span>
                    <ArrowRight size={15} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* MAIN 3-STEP CHECKOUT LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Steps & Forms */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stepper Progress Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  {/* Step 1 Indicator */}
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-left group"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 1
                          ? 'bg-[#844AFB] text-white shadow-md shadow-[#844AFB]/30'
                          : step > 1
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step > 1 ? <Check size={14} className="stroke-[3]" /> : '1'}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold ${step === 1 ? 'text-[#844AFB]' : 'text-slate-800'}`}>
                        Address
                      </p>
                      <p className="text-[10px] text-slate-400">Shipping destination</p>
                    </div>
                  </button>

                  <ChevronRight size={16} className="text-slate-300" />

                  {/* Step 2 Indicator */}
                  <button
                    onClick={() => {
                      if (step > 2) setStep(2);
                    }}
                    disabled={step < 2}
                    className="flex items-center gap-2 text-left group disabled:opacity-50"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 2
                          ? 'bg-[#844AFB] text-white shadow-md shadow-[#844AFB]/30'
                          : step > 2
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step > 2 ? <Check size={14} className="stroke-[3]" /> : '2'}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold ${step === 2 ? 'text-[#844AFB]' : 'text-slate-800'}`}>
                        Shipping
                      </p>
                      <p className="text-[10px] text-slate-400">Courier &amp; dispatch</p>
                    </div>
                  </button>

                  <ChevronRight size={16} className="text-slate-300" />

                  {/* Step 3 Indicator */}
                  <div className="flex items-center gap-2 text-left">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 3
                          ? 'bg-[#844AFB] text-white shadow-md shadow-[#844AFB]/30'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      3
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold ${step === 3 ? 'text-[#844AFB]' : 'text-slate-800'}`}>
                        Review &amp; Payment
                      </p>
                      <p className="text-[10px] text-slate-400">Summary &amp; confirm</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 1: ADDRESS */}
              <div
                className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                  step === 1 ? 'bg-white border-[#844AFB] shadow-md' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#EEE8FA] text-[#844AFB]">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-base text-[#050507]">
                        Step 1: Contact &amp; Shipping Address
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {isAuthenticated
                          ? `Logged in as ${email}`
                          : `Checking out as Guest (${email})`}
                      </p>
                    </div>
                  </div>

                  {step > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#844AFB] hover:bg-[#EEE8FA] h-8 px-2.5 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 size={13} />
                      <span>Change Address</span>
                    </Button>
                  )}
                </div>

                {step === 1 ? (
                  <div className="space-y-6 text-xs">
                    {/* Saved Addresses for Authenticated Users */}
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-[#844AFB]" />
                          <span>Select from Saved Addresses</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {savedAddresses.map((addr) => {
                            const isSelected = selectedSavedAddrId === String(addr.id);
                            return (
                              <button
                                key={String(addr.id)}
                                type="button"
                                onClick={() => selectAddress(addr)}
                                className={`p-3 rounded-xl text-left border transition-all ${
                                  isSelected
                                    ? 'bg-purple-50/50 border-[#844AFB] ring-1 ring-[#844AFB]'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-bold text-slate-900">{addr.fullName}</p>
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-bold text-[#844AFB] bg-[#EEE8FA] px-1.5 py-0.5 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-600 line-clamp-1">{addr.line1}</p>
                                <p className="text-slate-500">
                                  {addr.city}, {addr.state} — {addr.pincode}
                                </p>
                                <p className="text-slate-500 font-mono mt-1">{addr.phone}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Contact Info Group */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Email Address *</label>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Mobile Phone (India) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 font-mono font-bold text-xs">
                              +91
                            </span>
                            <Input
                              type="tel"
                              placeholder="9876543210"
                              value={phone}
                              maxLength={10}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                              className="pl-12 bg-slate-50 border-slate-300 h-10 font-mono rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address Group */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                        Delivery Destination
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">First Name *</label>
                          <Input
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Last Name</label>
                          <Input
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="font-bold text-slate-700">Address Line 1 (Flat, House No., Building) *</label>
                          <Input
                            placeholder="Flat/House no., building, street address"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="font-bold text-slate-700">Address Line 2 (Area, Landmark - Optional)</label>
                          <Input
                            placeholder="Area, landmark, nearby location"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                        </div>

                        {/* PIN Code with live lookup */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700">PIN Code *</label>
                            {pincodeChecking && (
                              <span className="text-[10px] text-[#844AFB] animate-pulse">Checking...</span>
                            )}
                          </div>
                          <Input
                            placeholder="6-digit PIN code"
                            value={pincode}
                            maxLength={6}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setPincode(val);
                              if (val.length === 6) {
                                verifyPincode(val);
                              } else {
                                setPincodeResult(null);
                                setPincodeError(null);
                              }
                            }}
                            className="bg-slate-50 border-slate-300 h-10 font-mono rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                          {pincodeResult && pincodeResult.isServiceable && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-1">
                              <CheckCircle2 size={13} />
                              <span>
                                Serviceable ({pincodeResult.city}, {pincodeResult.state}) — {pincodeResult.estimatedDays}
                              </span>
                            </div>
                          )}
                          {pincodeError && (
                            <p className="text-[11px] text-red-500 mt-1">{pincodeError}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">City / Town *</label>
                          <Input
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="bg-slate-50 border-slate-300 h-10 rounded-xl focus:border-[#844AFB] focus:ring-[#844AFB]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">State *</label>
                          <select
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 h-10 px-3 rounded-xl text-xs font-semibold text-slate-800 focus:border-[#844AFB] focus:ring-[#844AFB] focus:outline-none"
                          >
                            {Object.keys(STATE_CODE_MAP).map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Country</label>
                          <Input
                            value="India"
                            disabled
                            className="bg-slate-100 border-slate-200 h-10 text-slate-600 font-semibold rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Billing Address Toggle */}
                    <div className="pt-3 border-t border-slate-100">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={billingSameAsShipping}
                          onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                          className="w-4 h-4 rounded text-[#844AFB] accent-[#844AFB] cursor-pointer"
                        />
                        <span className="font-bold text-slate-800">
                          Billing address is the same as shipping address
                        </span>
                      </label>

                      {!billingSameAsShipping && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                          <p className="font-bold text-slate-800 text-xs">Separate Billing Address</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Billing Full Name *</label>
                              <Input
                                placeholder="Full name"
                                value={billingFullName}
                                onChange={(e) => setBillingFullName(e.target.value)}
                                className="bg-white border-slate-300 h-9 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Billing Phone *</label>
                              <Input
                                placeholder="Phone number"
                                value={billingPhone}
                                maxLength={10}
                                onChange={(e) => setBillingPhone(e.target.value.replace(/\D/g, ''))}
                                className="bg-white border-slate-300 h-9 rounded-lg font-mono"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="font-bold text-slate-700">Billing Street Address *</label>
                              <Input
                                placeholder="House no., street"
                                value={billingLine1}
                                onChange={(e) => setBillingLine1(e.target.value)}
                                className="bg-white border-slate-300 h-9 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Billing PIN Code *</label>
                              <Input
                                placeholder="6-digit PIN"
                                value={billingPincode}
                                maxLength={6}
                                onChange={(e) => setBillingPincode(e.target.value.replace(/\D/g, ''))}
                                className="bg-white border-slate-300 h-9 rounded-lg font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Billing City *</label>
                              <Input
                                placeholder="City"
                                value={billingCity}
                                onChange={(e) => setBillingCity(e.target.value)}
                                className="bg-white border-slate-300 h-9 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Optional Business / GST Details */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowGstForm(!showGstForm)}
                        className="flex items-center gap-2 text-xs font-bold text-[#844AFB] hover:text-[#6721F2] transition-colors"
                      >
                        <Building size={14} />
                        <span>{showGstForm ? '— Remove Business / GST Details' : '+ Add Business / GST Details for Tax Invoice'}</span>
                      </button>

                      {showGstForm && (
                        <div className="mt-3 p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-3">
                          <p className="text-[11px] text-slate-600">
                            Enter your registered business credentials to receive an official B2B GST tax invoice with input tax credit eligibility.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">Company / Entity Name *</label>
                              <Input
                                placeholder="e.g. Acme Robotics Pvt Ltd"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="bg-white border-slate-300 h-9 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700">GSTIN (15 Digits) *</label>
                              <Input
                                placeholder="e.g. 33ABCDE1234F1Z5"
                                value={gstin}
                                maxLength={15}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase().trim();
                                  setGstin(val);
                                  if (val && !validateGst(val)) {
                                    setGstError('Invalid 15-character GST format');
                                  } else {
                                    setGstError(null);
                                  }
                                }}
                                className="bg-white border-slate-300 h-9 rounded-lg font-mono uppercase"
                              />
                              {gstError && <p className="text-[10px] text-red-500">{gstError}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      <Button
                        onClick={handleProceedToShipping}
                        className="w-full sm:w-auto h-11 px-8 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-md shadow-[#844AFB]/20 flex items-center justify-center gap-2"
                      >
                        <span>Continue to Shipping Method</span>
                        <ArrowRight size={15} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Collapsed Step 1 Summary */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">
                        {firstName} {lastName} ({phone})
                      </p>
                      <p className="text-slate-600">
                        {addressLine1}{addressLine2 ? `, ${addressLine2}` : ''}, {city}, {stateName} — <span className="font-mono font-semibold">{pincode}</span>
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Contact: {email}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="self-start sm:self-auto h-8 px-3 border-slate-300 text-xs font-semibold rounded-lg hover:border-[#844AFB]"
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* STEP 2: SHIPPING / DISPATCH */}
              <div
                className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                  step === 2 ? 'bg-white border-[#844AFB] shadow-md' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#EEE8FA] text-[#844AFB]">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-base text-[#050507]">
                        Step 2: Shipping &amp; Dispatch Method
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Tracked dispatch from Tamil Nadu warehouse
                      </p>
                    </div>
                  </div>

                  {step > 2 && (
                    <Button
                      variant="ghost"
                      onClick={() => setStep(2)}
                      className="text-xs font-bold text-[#844AFB] hover:bg-[#EEE8FA] h-8 px-2.5 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 size={13} />
                      <span>Change Shipping</span>
                    </Button>
                  )}
                </div>

                {step === 2 ? (
                  <div className="space-y-6 text-xs">
                    {/* Destination recap */}
                    <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <MapPin size={16} className="text-[#844AFB] flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                            Shipping Destination
                          </p>
                          <p className="font-semibold text-slate-800">
                            {city}, {stateName} — <span className="font-mono">{pincode}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-[#844AFB] hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {/* Available Shipping Methods */}
                    <div className="space-y-3">
                      {/* Option 1: Standard Surface Delivery */}
                      <label
                        className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          shippingMethod === 'standard'
                            ? 'bg-purple-50/50 border-[#844AFB] ring-1 ring-[#844AFB]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'standard'}
                            onChange={() => setShippingMethod('standard')}
                            className="mt-1 w-4 h-4 text-[#844AFB] accent-[#844AFB]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">Standard Surface Delivery</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Estimated Delivery: Dispatch within 10 days ({pincodeResult?.estimatedDays || '2 – 4 Business Days transit across India'})
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                              <Truck size={13} className="text-[#844AFB]" />
                              <span>Couriers: {pincodeResult?.courierName || 'Delhivery / BlueDart / ST Courier'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-extrabold text-sm text-slate-900">
                            ₹{(standardShippingCost / 100).toFixed(0)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Standard Dispatch
                          </p>
                        </div>
                      </label>

                      {/* Option 2: Express Priority Air */}
                      <label
                        className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          shippingMethod === 'express'
                            ? 'bg-purple-50/50 border-[#844AFB] ring-1 ring-[#844AFB]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={shippingMethod === 'express'}
                            onChange={() => setShippingMethod('express')}
                            className="mt-1 w-4 h-4 text-[#844AFB] accent-[#844AFB]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">Express Priority Air</p>
                              <span className="text-[10px] font-bold text-[#844AFB] bg-[#EEE8FA] px-2 py-0.5 rounded-full">
                                FAST DISPATCH
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Estimated Delivery: Dispatch within 10 days (1 – 2 Business Days priority flight transit)
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Guaranteed engineering bench-testing and priority courier allocation
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-extrabold text-sm text-slate-900">
                            ₹{(expressShippingCost / 100).toFixed(0)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Air Cargo</p>
                        </div>
                      </label>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="h-11 px-5 border-slate-300 hover:border-slate-400 text-xs font-semibold rounded-xl"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleProceedToReview}
                        className="h-11 px-8 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-md shadow-[#844AFB]/20 flex items-center justify-center gap-2"
                      >
                        <span>Continue to Review &amp; Payment</span>
                        <ArrowRight size={15} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Collapsed Step 2 Summary */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">
                        {shippingMethod === 'express' ? 'Express Priority Air (1–2 Days)' : 'Standard Surface Delivery'}
                      </p>
                      <p className="text-slate-500">
                        Shipping Fee: {selectedShippingPaise === 0 ? 'FREE' : `₹${(selectedShippingPaise / 100).toFixed(2)}`}
                      </p>
                    </div>
                    {step > 2 && (
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="self-start sm:self-auto h-8 px-3 border-slate-300 text-xs font-semibold rounded-lg hover:border-[#844AFB]"
                      >
                        Change
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 3: REVIEW ORDER & MAKE PAYMENT */}
              <div
                className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                  step === 3 ? 'bg-white border-[#844AFB] shadow-md' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-2 rounded-xl bg-[#EEE8FA] text-[#844AFB]">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#050507]">
                      Step 3: Review Order &amp; Make Payment
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Final confirmation before order placement
                    </p>
                  </div>
                </div>

                {step === 3 && (
                  <div className="space-y-6 text-xs">
                    {/* Compact Review Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Destination Summary */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                              <MapPin size={14} className="text-[#844AFB]" />
                              <span>Delivering To</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="text-[11px] font-bold text-[#844AFB] hover:underline"
                            >
                              Change
                            </button>
                          </div>
                          <p className="font-semibold text-slate-800">{firstName} {lastName}</p>
                          <p className="text-slate-600">{addressLine1}, {city}, {stateName} — {pincode}</p>
                          <p className="text-slate-500 font-mono mt-1">Phone: +91 {phone}</p>
                        </div>
                      </div>

                      {/* Shipping Summary */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                              <Truck size={14} className="text-[#844AFB]" />
                              <span>Shipping Method</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="text-[11px] font-bold text-[#844AFB] hover:underline"
                            >
                              Change
                            </button>
                          </div>
                          <p className="font-semibold text-slate-800">
                            {shippingMethod === 'express' ? 'Express Priority Air (1–2 Days)' : 'Standard Surface Delivery (2–4 Days)'}
                          </p>
                          <p className="text-slate-500 mt-1">
                            Shipping fee: ₹{(selectedShippingPaise / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Products Being Purchased */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                          Items in Order ({items.reduce((s, i) => s + i.quantity, 0)})
                        </h3>
                        <Link href="/cart" className="text-xs font-bold text-[#844AFB] hover:underline">
                          Edit Cart
                        </Link>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                        {items.map((item) => (
                          <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 relative flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {item.imageUrl ? (
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="48px"
                                  />
                                ) : (
                                  <Package size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                                <p className="text-slate-500 text-[11px]">
                                  Qty: <span className="font-mono font-bold text-slate-800">{item.quantity}</span> &times; ₹{(item.pricePaise / 100).toFixed(2)}
                                </p>
                                {item.appliedTierLabel && (
                                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                                    {item.appliedTierLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <PriceTag pricePaise={item.pricePaise * item.quantity} size="sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Choose Payment Method */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                        Payment Method (Online Payment Only)
                      </h3>

                      <div className="space-y-3">
                        {/* Razorpay Online */}
                        {isRazorpayEnabled ? (
                          <div className="p-4 rounded-xl border bg-purple-50/50 border-[#844AFB] ring-1 ring-[#844AFB]">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-4 h-4 rounded-full bg-[#844AFB] flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900">
                                    Razorpay Standard Checkout (Online Payment)
                                  </p>
                                  <span className="text-[10px] font-bold text-[#844AFB] bg-[#EEE8FA] px-2 py-0.5 rounded-full">
                                    INSTANT CONFIRMATION
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  UPI (Google Pay, PhonePe, Paytm, BHIM, CRED), Credit/Debit Cards, NetBanking, EMI &amp; Wallets
                                </p>
                                <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100">
                                  <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    UPI / QR
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    Visa / Mastercard / RuPay
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    50+ Banks NetBanking
                                  </span>
                                </div>
                                <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                                  <ShieldCheck size={13} />
                                  <span>Server-authoritative verification &amp; instant invoice generation</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <AlertCircle size={14} className="text-amber-600" />
                              <span>Online Payment Temporarily Unavailable</span>
                            </p>
                            <p className="text-amber-700">
                              Razorpay gateway configuration is being verified. Please contact support@ttrc.store or try again later. Cash on Delivery is not offered on TTRC Store.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Terms Acceptance Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-[#844AFB] accent-[#844AFB] cursor-pointer"
                        />
                        <span className="text-xs text-slate-600 leading-snug">
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" className="font-bold text-[#844AFB] underline">
                            Terms &amp; Conditions
                          </Link>
                          ,{' '}
                          <Link href="/privacy-policy" target="_blank" className="font-bold text-[#844AFB] underline">
                            Privacy Policy
                          </Link>
                          , and{' '}
                          <Link href="/shipping-policy" target="_blank" className="font-bold text-[#844AFB] underline">
                            Shipping &amp; Return Policy (Dispatch within 10 days)
                          </Link>
                          .
                        </span>
                      </label>
                    </div>

                    {/* Inline Error Display */}
                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle size={16} className="flex-shrink-0 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-red-800">Payment Notice</p>
                          <p className="text-red-700 mt-0.5">{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Place Order CTA Button */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        disabled={loading}
                        className="w-full sm:w-auto h-12 px-6 border-slate-300 text-xs font-semibold rounded-xl"
                      >
                        Back to Shipping
                      </Button>

                      <Button
                        onClick={handlePlaceOrder}
                        disabled={loading || !termsAccepted || !isRazorpayEnabled}
                        className="w-full sm:flex-1 h-12 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#844AFB]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing Order...</span>
                          </span>
                        ) : isRazorpayEnabled ? (
                          <>
                            <Lock size={16} />
                            <span>Pay ₹{(finalPayablePaise / 100).toFixed(2)} with Razorpay</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} />
                            <span>Online Payment Unavailable</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Sticky Order Summary & Coupon Panel */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-heading font-bold text-base text-[#050507]">Order Summary</h3>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    {items.reduce((s, i) => s + i.quantity, 0)} Items
                  </span>
                </div>

                {/* Items Mini-Rail */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs divide-y divide-slate-50">
                  {items.map((i) => (
                    <div key={i.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{i.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Qty: {i.quantity} &times; ₹{(i.pricePaise / 100).toFixed(2)}
                        </p>
                      </div>
                      <PriceTag pricePaise={i.pricePaise * i.quantity} size="sm" />
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag size={13} className="text-[#844AFB]" />
                    <span>Have a Coupon Code?</span>
                  </label>

                  {couponCode ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="font-mono font-bold text-emerald-800">{couponCode}</p>
                          <p className="text-[11px] text-emerald-700">
                            Saved ₹{((discountPaise || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. WELCOME10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="bg-slate-50 border-slate-300 h-9 rounded-xl font-mono text-xs uppercase"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="h-9 px-4 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                  )}

                  {couponMessage && (
                    <p
                      className={`text-[11px] mt-1 font-medium ${
                        couponMessage.isError ? 'text-red-500' : 'text-emerald-600'
                      }`}
                    >
                      {couponMessage.text}
                    </p>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (Excl. GST)</span>
                    <PriceTag pricePaise={totals.subtotalPaise} size="sm" />
                  </div>

                  {discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Coupon Discount</span>
                      <span>— ₹{(discountPaise / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Shipping ({shippingMethod === 'express' ? 'Express Air' : 'Standard Delivery'})</span>
                    <span className="font-semibold text-slate-800">
                      ₹{(selectedShippingPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>GST (Added on Invoice — {stateName === 'Tamil Nadu' ? 'CGST + SGST' : 'IGST'})</span>
                    <span className="font-semibold text-slate-800">
                      + ₹{(totalTaxPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500 text-[11px] pl-2 border-l-2 border-purple-200">
                    <span>{stateName === 'Tamil Nadu' ? 'CGST (9%) + SGST (9%)' : 'IGST (18%)'}</span>
                    <span>
                      {stateName === 'Tamil Nadu'
                        ? `CGST: ₹${(totalCgstPaise / 100).toFixed(2)} | SGST: ₹${(totalSgstPaise / 100).toFixed(2)}`
                        : `IGST: ₹${(totalTaxPaise / 100).toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline text-base font-extrabold text-[#050507] pt-3 border-t border-slate-200">
                    <span>Total Payable</span>
                    <PriceTag pricePaise={finalPayablePaise} size="default" />
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>Fast dispatch &amp; pan-India courier delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#844AFB] flex-shrink-0" />
                    <span>Standard manufacturer warranty on all robotics kits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-slate-600 flex-shrink-0" />
                    <span>Direct secure processing via Razorpay (UPI, Cards &amp; NetBanking)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
