import { describe, it, expect } from 'vitest';
import {
  formatRupees,
  calculateDiscount,
  calculateGstFromInclusive,
  calculateGstFromExclusive,
  calculateShipping,
  computeOrderTotals,
  FREE_SHIPPING_THRESHOLD_PAISE,
  COD_CHARGE_PAISE,
  BASE_SHIPPING_PAISE,
} from '../pricing';

// ─── formatRupees ─────────────────────────────────────────────────────────────

describe('formatRupees', () => {
  it('formats zero paise to ₹0', () => {
    expect(formatRupees(0)).toBe('₹0');
  });

  it('formats 100 paise to ₹1', () => {
    expect(formatRupees(100)).toBe('₹1');
  });

  it('formats 149900 paise to ₹1,499', () => {
    expect(formatRupees(149900)).toBe('₹1,499');
  });

  it('formats 249900 paise to ₹2,499', () => {
    expect(formatRupees(249900)).toBe('₹2,499');
  });

  it('formats with decimals when requested', () => {
    expect(formatRupees(149950, true)).toBe('₹1,499.50');
  });

  it('throws TypeError for non-integer paise', () => {
    expect(() => formatRupees(149.99)).toThrow(TypeError);
  });

  it('formats large values with Indian number grouping', () => {
    expect(formatRupees(10000000)).toBe('₹1,00,000'); // 1 lakh rupees
  });
});

// ─── calculateDiscount ────────────────────────────────────────────────────────

describe('calculateDiscount', () => {
  it('returns 0 when price equals MRP', () => {
    expect(calculateDiscount(100000, 100000)).toBe(0);
  });

  it('returns 0 when price is higher than MRP', () => {
    expect(calculateDiscount(120000, 100000)).toBe(0);
  });

  it('returns 0 when MRP is 0', () => {
    expect(calculateDiscount(100, 0)).toBe(0);
  });

  it('calculates 28.6% off correctly (rounds)', () => {
    // (349900 - 249900) / 349900 ≈ 28.6%
    expect(calculateDiscount(249900, 349900)).toBe(29);
  });

  it('calculates 50% off correctly', () => {
    expect(calculateDiscount(5000, 10000)).toBe(50);
  });

  it('calculates 25% off correctly', () => {
    expect(calculateDiscount(7500, 10000)).toBe(25);
  });

  it('throws TypeError for non-integer inputs', () => {
    expect(() => calculateDiscount(99.5, 100)).toThrow(TypeError);
  });
});

// ─── calculateGstFromInclusive ────────────────────────────────────────────────

describe('calculateGstFromInclusive (intra-state)', () => {
  it('returns zero GST for 0% rate', () => {
    const result = calculateGstFromInclusive(10000, 0, false);
    expect(result.gstAmountPaise).toBe(0);
    expect(result.taxableAmountPaise).toBe(10000);
    expect(result.cgstPaise).toBe(0);
    expect(result.sgstPaise).toBe(0);
    expect(result.totalWithGstPaise).toBe(10000);
  });

  it('splits 18% GST equally into CGST + SGST (intra-state)', () => {
    // Price: ₹118 inclusive → taxable: ₹100, GST: ₹18
    const result = calculateGstFromInclusive(11800, 18, false);
    expect(result.taxableAmountPaise).toBe(10000);
    expect(result.gstAmountPaise).toBe(1800);
    expect(result.cgstPaise).toBe(900); // 9% CGST
    expect(result.sgstPaise).toBe(900); // 9% SGST
    expect(result.igstPaise).toBe(0);
    expect(result.totalWithGstPaise).toBe(11800);
  });

  it('puts full GST into IGST for inter-state', () => {
    const result = calculateGstFromInclusive(11800, 18, true);
    expect(result.cgstPaise).toBe(0);
    expect(result.sgstPaise).toBe(0);
    expect(result.igstPaise).toBe(1800);
  });

  it('handles 5% GST correctly', () => {
    // ₹105 inclusive → taxable: ₹100, GST: ₹5
    const result = calculateGstFromInclusive(10500, 5, false);
    expect(result.taxableAmountPaise).toBe(10000);
    expect(result.gstAmountPaise).toBe(500);
    expect(result.cgstPaise).toBe(250); // 2.5% CGST
    expect(result.sgstPaise).toBe(250); // 2.5% SGST
  });

  it('handles 12% GST correctly', () => {
    const result = calculateGstFromInclusive(11200, 12, false);
    expect(result.taxableAmountPaise).toBe(10000);
    expect(result.gstAmountPaise).toBe(1200);
  });

  it('throws for negative price', () => {
    expect(() => calculateGstFromInclusive(-100, 18, false)).toThrow(TypeError);
  });

  it('handles zero price', () => {
    const result = calculateGstFromInclusive(0, 18, false);
    expect(result.gstAmountPaise).toBe(0);
    expect(result.totalWithGstPaise).toBe(0);
  });
});

describe('calculateGstFromExclusive', () => {
  it('calculates 18% GST on ₹100 exclusive', () => {
    const result = calculateGstFromExclusive(10000, 18, false);
    expect(result.gstAmountPaise).toBe(1800);
    expect(result.totalWithGstPaise).toBe(11800);
    expect(result.cgstPaise).toBe(900);
    expect(result.sgstPaise).toBe(900);
  });
});

// ─── calculateShipping ────────────────────────────────────────────────────────

describe('calculateShipping', () => {
  it('gives free shipping when subtotal >= threshold', () => {
    const result = calculateShipping({
      orderSubtotalPaise: FREE_SHIPPING_THRESHOLD_PAISE,
      weightGrams: 1000,
      pincode: '641001',
      isCOD: false,
    });
    expect(result.isFreeShipping).toBe(true);
    expect(result.shippingChargePaise).toBe(0);
  });

  it('charges base shipping for orders under threshold and ≤500g', () => {
    const result = calculateShipping({
      orderSubtotalPaise: 50000, // ₹500
      weightGrams: 300,
      pincode: '641001',
      isCOD: false,
    });
    expect(result.isFreeShipping).toBe(false);
    expect(result.shippingChargePaise).toBe(BASE_SHIPPING_PAISE);
  });

  it('adds per-500g charge for heavier items', () => {
    const result = calculateShipping({
      orderSubtotalPaise: 50000,
      weightGrams: 1000, // 500g extra → 1 slab
      pincode: '641001',
      isCOD: false,
    });
    expect(result.shippingChargePaise).toBe(BASE_SHIPPING_PAISE + 2000);
  });

  it('adds COD charge when isCOD is true', () => {
    const result = calculateShipping({
      orderSubtotalPaise: 50000,
      weightGrams: 200,
      pincode: '641001',
      isCOD: true,
    });
    expect(result.codChargePaise).toBe(COD_CHARGE_PAISE);
  });

  it('no COD charge when isCOD is false', () => {
    const result = calculateShipping({
      orderSubtotalPaise: 50000,
      weightGrams: 200,
      pincode: '641001',
      isCOD: false,
    });
    expect(result.codChargePaise).toBe(0);
  });
});

// ─── computeOrderTotals ───────────────────────────────────────────────────────

describe('computeOrderTotals', () => {
  it('computes basic totals with no discount', () => {
    const result = computeOrderTotals({
      itemSubtotalPaise: 100000,
      shippingPaise: 5900,
      codChargePaise: 0,
      couponDiscountPaise: 0,
    });
    expect(result.subtotalPaise).toBe(100000);
    expect(result.discountPaise).toBe(0);
    expect(result.shippingPaise).toBe(5900);
    expect(result.totalPaise).toBe(105900);
  });

  it('applies coupon discount correctly', () => {
    const result = computeOrderTotals({
      itemSubtotalPaise: 100000,
      shippingPaise: 0,
      codChargePaise: 0,
      couponDiscountPaise: 10000,
    });
    expect(result.discountPaise).toBe(10000);
    expect(result.totalPaise).toBe(90000);
  });

  it('caps discount at subtotal (cannot go negative)', () => {
    const result = computeOrderTotals({
      itemSubtotalPaise: 5000,
      shippingPaise: 0,
      codChargePaise: 0,
      couponDiscountPaise: 10000, // bigger than subtotal
    });
    expect(result.discountPaise).toBe(5000);
    expect(result.totalPaise).toBe(0);
  });

  it('includes COD charge in shipping total', () => {
    const result = computeOrderTotals({
      itemSubtotalPaise: 50000,
      shippingPaise: 5900,
      codChargePaise: 5000,
      couponDiscountPaise: 0,
    });
    expect(result.shippingPaise).toBe(10900); // 59 + 50
    expect(result.totalPaise).toBe(60900);
  });
});
