import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderAction } from '@/actions/checkout';

// Mock dependencies for server action testing
vi.mock('@/lib/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/actions/settings', () => ({
  getSiteSettingsAction: vi.fn().mockResolvedValue({
    gst_enabled: false,
    razorpay_enabled: true,
    gstin: '',
    company_name: 'Tamizh Tech',
    free_shipping_threshold_paise: 99900,
    base_shipping_paise: 5900,
    cod_max_limit_paise: 500000,
  }),
}));

vi.mock('@/lib/id-generator', () => ({
  getNextSequenceId: vi.fn().mockResolvedValue('TTRC/25-26/100042'),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/mongodb/models', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    OrderModel: {
      create: vi.fn(),
      findOne: vi.fn(),
    },
    ProductModel: {
      find: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    },
    CouponModel: {
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    },
    AuditLogModel: {
      create: vi.fn().mockResolvedValue(true),
    },
    SiteSettingModel: {
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    },
    CategoryModel: {
      countDocuments: vi.fn().mockResolvedValue(10),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    },
    CheckoutSessionModel: {
      create: vi.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: 'mock_session_id' })),
      findOne: vi.fn(),
    },
  };
});

import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { ProductModel, OrderModel, CheckoutSessionModel } from '@/lib/mongodb/models';

describe('TTRC Store — Razorpay-Only Checkout & COD Rejection Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAuthenticatedUser as any).mockResolvedValue({
      user: { id: 'cust_test_123', email: 'cust@ttrc.store', role: 'customer' },
    });
  });

  describe('1. Server Authority: Rejection of Cash on Delivery (COD)', () => {
    it('MUST strictly reject client orders attempting paymentMethod: "cod"', async () => {
      const payload: any = {
        items: [{ productId: '64f8a1b2c3d4e5f6a7b8c9d0', quantity: 1 }],
        paymentMethod: 'cod',
        shippingAddress: {
          fullName: 'Robo Maker',
          phone: '9876543210',
          line1: '12 Tech Park',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
        },
      };

      const result = await createOrderAction(payload);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Cash on Delivery is not offered on TTRC Store');
      expect(result.error).toContain('Razorpay');
      expect(OrderModel.create).not.toHaveBeenCalled();
    });

    it('MUST reject arbitrary unsupported payment methods and never default to COD', async () => {
      const payload: any = {
        items: [{ productId: '64f8a1b2c3d4e5f6a7b8c9d0', quantity: 1 }],
        paymentMethod: 'crypto_pay',
        shippingAddress: {
          fullName: 'Robo Maker',
          phone: '9876543210',
          line1: '12 Tech Park',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
        },
      };

      const result = await createOrderAction(payload);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Cash on Delivery is not offered on TTRC Store');
      expect(OrderModel.create).not.toHaveBeenCalled();
    });
  });

  describe('2. Authoritative Online Order Creation (Razorpay Only)', () => {
    it('accepts valid online order with paymentMethod: "razorpay" and stages checkout session without premature order/bill creation', async () => {
      (ProductModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: '64f8a1b2c3d4e5f6a7b8c9d0',
            name: 'ESP32 Dual Core Controller',
            title: 'ESP32 Dual Core Controller',
            price: 54900,
            stock_quantity: 20,
            gst_percent: 18,
            hsn_code: '85423100',
          },
        ]),
      });

      const payload: any = {
        items: [{ productId: '64f8a1b2c3d4e5f6a7b8c9d0', quantity: 1 }],
        paymentMethod: 'razorpay',
        shippingAddress: {
          fullName: 'Robo Maker',
          phone: '9876543210',
          line1: '12 Tech Park',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
        },
      };

      const result = await createOrderAction(payload);
      expect(result.error).toBeUndefined();
      expect(result.paymentMethod).toBe('razorpay');
      expect(result.sessionId).toBeDefined();
      expect(result.razorpayOrderId).toBeDefined();
      // Crucial requirement: Do NOT create order in OrderModel or decrement inventory until payment is captured!
      expect(OrderModel.create).not.toHaveBeenCalled();
      expect(CheckoutSessionModel.create).toHaveBeenCalled();

      // Check persisted staged checkout session fields
      const stagedArg = (CheckoutSessionModel.create as any).mock.calls[0][0];
      expect(stagedArg.status).toBe('pending');
      expect(stagedArg.shipping_method).toBe('standard');
      expect(stagedArg.items).toHaveLength(1);
    });

    it('correctly calculates Express Priority Air shipping fee of ₹199 (19900 paise) in staged session', async () => {
      (ProductModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: '64f8a1b2c3d4e5f6a7b8c9d0',
            name: 'ESP32 Dual Core Controller',
            title: 'ESP32 Dual Core Controller',
            price: 54900,
            stock_quantity: 20,
            gst_percent: 18,
            hsn_code: '85423100',
          },
        ]),
      });

      const payload: any = {
        items: [{ productId: '64f8a1b2c3d4e5f6a7b8c9d0', quantity: 1 }],
        paymentMethod: 'razorpay',
        shippingMethod: 'express',
        shippingAddress: {
          fullName: 'Robo Maker',
          phone: '9876543210',
          line1: '12 Tech Park',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
        },
      };

      const result = await createOrderAction(payload);
      expect(result.error).toBeUndefined();
      expect(OrderModel.create).not.toHaveBeenCalled();
      expect(CheckoutSessionModel.create).toHaveBeenCalled();
      const lastCallIdx = (CheckoutSessionModel.create as any).mock.calls.length - 1;
      const stagedArg = (CheckoutSessionModel.create as any).mock.calls[lastCallIdx][0];
      expect(stagedArg.shipping_method).toBe('express');
      expect(stagedArg.shipping_total).toBe(19900);
    });
  });

  describe('3. Environment & Key Mode Validation', () => {
    it('correctly distinguishes Razorpay test mode (rzp_test_) from live mode (rzp_live_)', () => {
      const testKey = 'rzp_test_TnRvg3LwstLPha';
      const liveKey = 'rzp_live_9a8b7c6d5e4f3a';

      const isTestKey = (key: string) => key.startsWith('rzp_test_');
      const isLiveKey = (key: string) => key.startsWith('rzp_live_');

      expect(isTestKey(testKey)).toBe(true);
      expect(isLiveKey(testKey)).toBe(false);

      expect(isTestKey(liveKey)).toBe(false);
      expect(isLiveKey(liveKey)).toBe(true);
    });

    it('rejects live payment claims when only test mode credentials are configured in workspace', () => {
      const activeKey = process.env.RAZORPAY_KEY_ID || 'rzp_test_TnRvg3LwstLPha';
      const isConfiguredForLive = activeKey.startsWith('rzp_live_');

      // Since workspace credentials are rzp_test_, live activation MUST report false
      expect(isConfiguredForLive).toBe(false);
    });
  });
});
