import { describe, it, expect } from 'vitest';
import { formatRupees, calculateDiscount } from '../utils';

describe('formatRupees', () => {
  it('formats integer paise into INR currency format without decimals by default', () => {
    expect(formatRupees(249900)).toBe('₹2,499');
    expect(formatRupees(1500)).toBe('₹15');
    expect(formatRupees(0)).toBe('₹0');
  });

  it('formats integer paise into INR currency format with decimals when specified', () => {
    expect(formatRupees(249950, true)).toBe('₹2,499.50');
  });
});

describe('calculateDiscount', () => {
  it('calculates rounded discount percentage correctly', () => {
    expect(calculateDiscount(249900, 349900)).toBe(29);
    expect(calculateDiscount(1000, 2000)).toBe(50);
  });

  it('returns 0 if mrp is lower than or equal to selling price', () => {
    expect(calculateDiscount(2500, 2500)).toBe(0);
    expect(calculateDiscount(3000, 2500)).toBe(0);
  });
});
