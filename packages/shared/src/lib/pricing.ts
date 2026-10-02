/**
 * @ttrc/shared — Pricing, GST & Shipping utilities
 *
 * ALL monetary values are integer paise (1 INR = 100 paise).
 * These functions MUST be the single source of truth used by both
 * the web frontend (for display) and the Supabase Edge Functions
 * (for authoritative server-side computation).
 *
 * NEVER use floating-point arithmetic on money — always work in paise.
 */

// ─── Formatters ──────────────────────────────────────────────────────────────

/**
 * Format integer paise to a human-readable INR string.
 * e.g. 149900 → "₹1,499" or "₹1,499.00"
 */
export function formatRupees(paise: number, includeDecimals = false): string {
  if (!Number.isInteger(paise)) {
    throw new TypeError(`formatRupees: expected integer paise, got ${paise}`);
  }
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Calculate discount percentage from MRP and selling price (both in paise).
 * Returns 0 if no discount or invalid inputs.
 */
export function calculateDiscount(pricePaise: number, mrpPaise: number): number {
  if (!Number.isInteger(pricePaise) || !Number.isInteger(mrpPaise)) {
    throw new TypeError('calculateDiscount: both arguments must be integers (paise)');
  }
  if (mrpPaise <= 0 || pricePaise <= 0) return 0;
  if (mrpPaise <= pricePaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}

// ─── GST Calculation ─────────────────────────────────────────────────────────

/** Valid GST rates in India */
export type GstRate = 0 | 5 | 12 | 18 | 28;

export interface GstBreakdown {
  taxableAmountPaise: number;
  gstAmountPaise: number;
  cgstPaise: number;    // for intra-state transactions
  sgstPaise: number;    // for intra-state transactions
  igstPaise: number;    // for inter-state transactions
  totalWithGstPaise: number;
}

/**
 * Calculate GST breakdown from an INCLUSIVE price (price already includes GST).
 * TTRC Store displays prices inclusive of GST per Indian retail convention.
 *
 * @param inclusivePricePaise - The price that already includes GST (in paise)
 * @param gstPercent - The applicable GST rate (0, 5, 12, 18, or 28)
 * @param isInterState - true for IGST (inter-state), false for CGST+SGST (intra-state)
 */
export function calculateGstFromInclusive(
  inclusivePricePaise: number,
  gstPercent: GstRate,
  isInterState = false,
): GstBreakdown {
  if (!Number.isInteger(inclusivePricePaise) || inclusivePricePaise < 0) {
    throw new TypeError('calculateGstFromInclusive: price must be a non-negative integer (paise)');
  }

  if (gstPercent === 0) {
    return {
      taxableAmountPaise: inclusivePricePaise,
      gstAmountPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalWithGstPaise: inclusivePricePaise,
    };
  }

  // Reverse-calculate taxable amount from GST-inclusive price
  // taxable = price / (1 + gstRate/100)
  const taxableAmountPaise = Math.round(inclusivePricePaise / (1 + gstPercent / 100));
  const gstAmountPaise = inclusivePricePaise - taxableAmountPaise;

  if (isInterState) {
    return {
      taxableAmountPaise,
      gstAmountPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: gstAmountPaise,
      totalWithGstPaise: inclusivePricePaise,
    };
  } else {
    // Split equally between CGST and SGST (round CGST down if odd paise)
    const cgstPaise = Math.floor(gstAmountPaise / 2);
    const sgstPaise = gstAmountPaise - cgstPaise;
    return {
      taxableAmountPaise,
      gstAmountPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalWithGstPaise: inclusivePricePaise,
    };
  }
}

/**
 * Calculate GST from an EXCLUSIVE (pre-tax) price.
 * Used internally for server-side order computation.
 */
export function calculateGstFromExclusive(
  exclusivePricePaise: number,
  gstPercent: GstRate,
  isInterState = false,
): GstBreakdown {
  if (!Number.isInteger(exclusivePricePaise) || exclusivePricePaise < 0) {
    throw new TypeError('calculateGstFromExclusive: price must be a non-negative integer (paise)');
  }

  const gstAmountPaise = Math.round(exclusivePricePaise * gstPercent / 100);
  const totalWithGstPaise = exclusivePricePaise + gstAmountPaise;

  if (gstPercent === 0 || isInterState) {
    return {
      taxableAmountPaise: exclusivePricePaise,
      gstAmountPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: gstAmountPaise,
      totalWithGstPaise,
    };
  } else {
    const cgstPaise = Math.floor(gstAmountPaise / 2);
    const sgstPaise = gstAmountPaise - cgstPaise;
    return {
      taxableAmountPaise: exclusivePricePaise,
      gstAmountPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalWithGstPaise,
    };
  }
}

// ─── Shipping Calculation ─────────────────────────────────────────────────────

export interface ShippingInput {
  orderSubtotalPaise: number;  // after discount, before shipping
  weightGrams: number;
  pincode: string;
  isCOD: boolean;
}

export interface ShippingResult {
  shippingChargePaise: number;
  codChargePaise: number;
  isFreeShipping: boolean;
  estimatedDays: { min: number; max: number };
}

/** Free shipping threshold: ₹999 (99900 paise) */
export const FREE_SHIPPING_THRESHOLD_PAISE = 99900;
/** COD extra charge: ₹50 */
export const COD_CHARGE_PAISE = 5000;
/** Base shipping rate for orders under threshold */
export const BASE_SHIPPING_PAISE = 5900; // ₹59
/** Additional charge per 500g beyond 500g */
export const PER_500G_ADDITIONAL_PAISE = 2000; // ₹20

/**
 * Calculate shipping charges for an order.
 * Server-side authoritative calculation — do not trust client amounts.
 */
export function calculateShipping(input: ShippingInput): ShippingResult {
  const { orderSubtotalPaise, weightGrams, isCOD } = input;

  const isFreeShipping = orderSubtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE;

  let shippingChargePaise = 0;
  if (!isFreeShipping) {
    // Base rate covers first 500g
    shippingChargePaise = BASE_SHIPPING_PAISE;
    if (weightGrams > 500) {
      const extra500gSlabs = Math.ceil((weightGrams - 500) / 500);
      shippingChargePaise += extra500gSlabs * PER_500G_ADDITIONAL_PAISE;
    }
  }

  const codChargePaise = isCOD ? COD_CHARGE_PAISE : 0;

  // Rough ETA — refine with actual Shiprocket API in Phase 4
  const estimatedDays = { min: 3, max: 7 };

  return {
    shippingChargePaise,
    codChargePaise,
    isFreeShipping,
    estimatedDays,
  };
}

// ─── Order Total ──────────────────────────────────────────────────────────────

export interface OrderTotalsInput {
  itemSubtotalPaise: number;   // sum of (pricePaise × qty) for all items
  shippingPaise: number;
  codChargePaise: number;
  couponDiscountPaise: number;
}

export interface OrderTotals {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
}

/** Compute final order totals (display + invoice). */
export function computeOrderTotals(input: OrderTotalsInput): OrderTotals {
  const { itemSubtotalPaise, shippingPaise, codChargePaise, couponDiscountPaise } = input;
  const discountPaise = Math.min(couponDiscountPaise, itemSubtotalPaise); // can't discount more than subtotal
  const totalPaise = itemSubtotalPaise - discountPaise + shippingPaise + codChargePaise;
  return {
    subtotalPaise: itemSubtotalPaise,
    discountPaise,
    shippingPaise: shippingPaise + codChargePaise,
    totalPaise: Math.max(totalPaise, 0),
  };
}
