import type { OrderStatus, UserRole } from '../types/cart-order';

// ─── Category Tree ────────────────────────────────────────────────────────────

export interface CategoryTreeNode {
  slug: string;
  name: string;
  icon: string;
  subcategories?: { slug: string; name: string }[];
}

export const CATEGORY_TREE: CategoryTreeNode[] = [
  {
    slug: 'gamified-robots',
    name: 'Gamified Robots',
    icon: 'bot',
    subcategories: [
      { slug: 'robo-race', name: 'Robo Race' },
      { slug: 'line-follower', name: 'Line Follower' },
      { slug: 'robo-soccer', name: 'Robo Soccer' },
    ],
  },
  {
    slug: 'stem-kits',
    name: 'STEM Kits',
    icon: 'flask-conical',
    subcategories: [],
  },
  {
    slug: 'fasteners',
    name: 'Fasteners',
    icon: 'settings-2',
    subcategories: [],
  },
  {
    slug: 'batteries',
    name: 'Batteries',
    icon: 'battery-charging',
    subcategories: [],
  },
  {
    slug: 'motors',
    name: 'Motors',
    icon: 'rotate-3d',
    subcategories: [],
  },
  {
    slug: 'sensors',
    name: 'Sensors',
    icon: 'scan',
    subcategories: [],
  },
  {
    slug: 'drones',
    name: 'Drones',
    icon: 'plane',
    subcategories: [],
  },
  {
    slug: 'wires-connectors',
    name: 'Wires & Connectors',
    icon: 'cable',
    subcategories: [],
  },
] as const;

// ─── Order Statuses ────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  payment_failed: 'Payment Failed',
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const ORDER_STATUS_LIST: OrderStatus[] = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
];

/** Statuses where cancellation is still allowed */
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  'pending_payment',
  'confirmed',
  'processing',
];

// ─── GST Rates ────────────────────────────────────────────────────────────────

/** Valid GST slabs in India */
export const VALID_GST_RATES = [0, 5, 12, 18, 28] as const;

/** Default GST rate for electronics/robotics components */
export const DEFAULT_GST_PERCENT = 18;

// ─── Business Info ────────────────────────────────────────────────────────────

export const BUSINESS_INFO = {
  name: 'Tamizh Tech',
  tradeName: 'TTRC Store',
  gstin: 'Not Registered (Bill of Supply)', // Updated when GSTIN added in site_settings
  address: 'Coimbatore, Tamil Nadu, India', // TODO: Replace with full address
  email: 'support@ttrc.store',
  phone: '+91 7904902978',
  website: 'https://ttrc.store',
  parentSite: 'https://tamizhtech.in',
  grievanceOfficer: 'PLACEHOLDER_NAME', // TODO: Replace before launch
  grievanceEmail: 'grievance@ttrc.store',
} as const;

// ─── Shipping ─────────────────────────────────────────────────────────────────

export const MAX_COD_ORDER_VALUE_PAISE = 500000; // ₹5,000 COD limit
export const LOW_STOCK_BADGE_THRESHOLD = 5;

// ─── User Roles ────────────────────────────────────────────────────────────────

export const USER_ROLES: UserRole[] = ['customer', 'admin', 'staff'];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: ['read:own_orders', 'write:own_cart', 'write:own_profile', 'write:own_reviews'],
  staff: ['read:all_orders', 'write:order_status', 'read:products', 'write:inventory'],
  admin: ['*'], // all permissions
};
