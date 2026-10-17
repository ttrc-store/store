import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderAction, releasePendingOrderAction } from '@/actions/checkout';
import { getMyOrderAction, getGuestOrderAction } from '@/actions/orders';
import { POST as webhookHandler } from '@/app/api/webhooks/razorpay/route';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/actions/settings', () => ({
  getSiteSettingsAction: vi.fn().mockResolvedValue({
    free_shipping_threshold_paise: 99900,
    base_shipping_paise: 5900,
    cod_max_limit_paise: 500000,
  }),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/id-generator', () => ({
  getNextSequenceId: vi.fn().mockResolvedValue('ORD-2026-9999'),
  generateBillNumber: vi.fn().mockResolvedValue('TTRC/25-26/009999'),
}));

vi.mock('@/lib/mongodb/models', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    OrderModel: {
      findOne: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
    ProductModel: {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn().mockResolvedValue({ acknowledged: true }),
      findOneAndUpdate: vi.fn(),
    },
    CouponModel: {
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    },
    AuditLogModel: {
      findOne: vi.fn(),
      create: vi.fn().mockResolvedValue(true),
    },
  };
});

import { getAuthenticatedUser, requireAuth } from '@/lib/auth-helpers';
import { OrderModel, ProductModel, AuditLogModel } from '@/lib/mongodb/models';

describe('TTRC Customer Experience & Reliability Improvements Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Idempotent Order Creation & Safe Payment Retry', () => {
    it('Reuses existing pending order when existingPendingOrderId is provided, preventing double stock deduction', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'usr_cust_1', email: 'cust1@ttrc.store', role: 'customer' },
      });

      const existingPendingOrder = {
        _id: 'mongo_order_pending_1',
        order_number: 'ORD-2026-0001',
        total: 250000,
        status: 'pending',
        payment_status: 'pending',
        user_id: 'usr_cust_1',
      };

      (OrderModel.findOne as any).mockResolvedValue(existingPendingOrder);

      const res = await createOrderAction({
        items: [{ productId: 'prod_kit_1', quantity: 1 }],
        paymentMethod: 'razorpay',
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543210',
          line1: '123 Tech Street',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
        },
        stateCode: '33',
        existingPendingOrderId: 'mongo_order_pending_1',
      });

      expect(res.success).toBe(true);
      expect(res.orderNumber).toBe('ORD-2026-0001');
      expect(res.orderId).toBe('mongo_order_pending_1');
      expect(res.amountPaise).toBe(250000);
      // Verify ProductModel was NOT decremented again
      expect(ProductModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('Releases reserved inventory and cancels pending order when releasePendingOrderAction is called', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'usr_cust_1', email: 'cust1@ttrc.store', role: 'customer' },
      });

      const mockPendingOrder = {
        _id: 'mongo_order_pending_1',
        order_number: 'ORD-2026-0001',
        status: 'pending',
        payment_status: 'pending',
        user_id: 'usr_cust_1',
        items: [
          { product_id: 'prod_1', quantity: 2 },
          { product_id: 'prod_2', quantity: 1 },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      (OrderModel.findOne as any).mockResolvedValue(mockPendingOrder);
      (OrderModel.findOneAndUpdate as any).mockImplementation((_filter: any, update: any) => {
        if (update?.$set) {
          Object.assign(mockPendingOrder, update.$set);
        }
        return Promise.resolve(mockPendingOrder);
      });

      const res = await releasePendingOrderAction('mongo_order_pending_1');

      expect(res.success).toBe(true);
      expect(mockPendingOrder.status).toBe('cancelled');
      expect(mockPendingOrder.payment_status).toBe('failed');
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('prod_1', {
        $inc: { stock_quantity: 2 },
      });
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('prod_2', {
        $inc: { stock_quantity: 1 },
      });
    });
  });

  describe('2. Webhook Stock Leak Protection on Payment Failure', () => {
    it('Restocks inventory automatically when Razorpay webhook receives payment.failed for a pending order', async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_key';

      const mockFailedOrder = {
        _id: 'mongo_order_failed_1',
        order_number: 'ORD-2026-0005',
        status: 'pending',
        payment_status: 'pending',
        items: [{ product_id: 'prod_motor_1', quantity: 4 }],
        save: vi.fn().mockResolvedValue(true),
      };

      (OrderModel.findOne as any).mockResolvedValue(mockFailedOrder);
      (OrderModel.findOneAndUpdate as any).mockImplementation((filter: any, update: any) => {
        if (filter.status === 'pending') {
          Object.assign(mockFailedOrder, update.$set);
          return Promise.resolve(mockFailedOrder);
        }
        return Promise.resolve(null);
      });
      (AuditLogModel.findOne as any).mockResolvedValue(null);

      const crypto = await import('crypto');
      const payload = JSON.stringify({
        event: 'payment.failed',
        event_id: 'evt_fail_999',
        payload: {
          payment: {
            entity: {
              id: 'pay_fail_123',
              order_id: 'ORD-2026-0005',
              amount: 50000,
            },
          },
        },
      });

      const signature = crypto
        .createHmac('sha256', 'test_webhook_secret_key')
        .update(payload)
        .digest('hex');

      const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: payload,
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);

      expect(mockFailedOrder.status).toBe('cancelled');
      expect(mockFailedOrder.payment_status).toBe('failed');
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('prod_motor_1', {
        $inc: { stock_quantity: 4 },
      });
    });
  });

  describe('3. Order Tracking Accuracy for Authenticated & Guest Buyers', () => {
    it('Allows getMyOrderAction to look up by human order_number without throwing CastError', async () => {
      (requireAuth as any).mockResolvedValue({
        user: { id: 'usr_cust_1', email: 'cust1@ttrc.store', role: 'customer' },
      });

      const mockDbOrder = {
        _id: '670000000000000000000001',
        order_number: 'ORD-2026-0001',
        user_id: 'usr_cust_1',
        status: 'processing',
        payment_method: 'razorpay',
        total: 150000,
        subtotal: 130000,
        discount_total: 0,
        tax_total: 20000,
        shipping_address: { fullName: 'Test User' },
        created_at: new Date(),
        items: [],
      };

      (OrderModel.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDbOrder),
      });

      const res = await getMyOrderAction('ORD-2026-0001');
      expect(res.order).toBeDefined();
      expect(res.order?.order_number).toBe('ORD-2026-0001');
      expect(res.order?.status).toBe('processing');
    });

    it('Allows guests to track order using order number and guest email/phone', async () => {
      const mockGuestOrder = {
        _id: '670000000000000000000002',
        order_number: 'ORD-2026-0002',
        guest_email: 'guest@student.edu',
        status: 'shipped',
        payment_method: 'razorpay',
        total: 99900,
        subtotal: 85000,
        discount_total: 0,
        tax_total: 14900,
        shipping_address: { fullName: 'Guest Student', phone: '9876543210' },
        tracking_number: 'DELHIVERY-AWB-12345',
        tracking_url: 'https://delhivery.com/track/DELHIVERY-AWB-12345',
        created_at: new Date(),
        items: [],
      };

      (OrderModel.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockGuestOrder),
      });

      const res = await getGuestOrderAction('ORD-2026-0002', 'guest@student.edu');
      expect(res.order).toBeDefined();
      expect(res.order?.order_number).toBe('ORD-2026-0002');
      expect(res.order?.shipments?.[0]?.tracking_number).toBe('DELHIVERY-AWB-12345');
      expect(res.order?.shipments?.[0]?.tracking_url).toBe('https://delhivery.com/track/DELHIVERY-AWB-12345');
    });

    it('Rejects guest tracking when email does not match order record', async () => {
      (OrderModel.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await getGuestOrderAction('ORD-2026-0002', 'wrongemail@example.com');
      expect(res.error).toBe('Order not found. Please verify your order number and email/phone.');
    });
  });
});
