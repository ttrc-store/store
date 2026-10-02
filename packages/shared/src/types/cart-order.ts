/** Saved address for a customer */
export interface Address {
  id: string;
  userId: string;
  label: string | null;     // e.g. "Home", "College"
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

/** Cart item (guest or authenticated) */
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  // Snapshot at time of add — for display only; server re-validates at checkout
  snapshotName: string;
  snapshotPricePaise: number;
  snapshotImageUrl: string | null;
  stockQty: number; // current stock, refreshed on cart open
}

export interface Cart {
  id: string;
  userId: string | null;  // null = guest
  sessionId: string | null;
  items: CartItem[];
  couponCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Order statuses — source of truth in constants.ts */
export type OrderStatus =
  | 'pending_payment'
  | 'payment_failed'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPricePaise: number;
  gstPercent: number;
  hsnCode: string | null;
  snapshotName: string;
  snapshotSku: string;
  snapshotImageUrl: string | null;
}

/** GST breakdown stored on the order */
export interface GSTBreakdown {
  taxableAmountPaise: number;
  cgstPaise: number;   // intra-state
  sgstPaise: number;   // intra-state
  igstPaise: number;   // inter-state
  totalGstPaise: number;
}

export interface Order {
  id: string;
  userId: string | null;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddressId: string;
  // Amounts — all integer paise, computed server-side
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  gst: GSTBreakdown;
  totalPaise: number;
  // Coupon
  couponCode: string | null;
  couponDiscountPaise: number;
  // Payment
  paymentMethod: 'razorpay' | 'cod';
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  // Invoice
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/** User role */
export type UserRole = 'customer' | 'admin' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}
