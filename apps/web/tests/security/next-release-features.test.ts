import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { createProductAction } from '@/actions/admin';
import { searchStoreProducts } from '@/lib/mongodb/catalog';
import {
  subscribeBackInStockAction,
  unsubscribeBackInStockAction,
  notifySubscribersOnRestock,
} from '@/actions/stock-subscriptions';
import { POST as webhookHandler } from '@/app/api/webhooks/razorpay/route';
import { releasePendingOrderAction, cleanupExpiredPendingOrdersAction } from '@/actions/checkout';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/email/resend', () => ({
  sendBackInStockEmail: vi.fn().mockResolvedValue({ success: true }),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendShipmentDispatchedEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/id-generator', () => ({
  getNextSequenceId: vi.fn().mockResolvedValue('ORD-2026-1001'),
  generateBillNumber: vi.fn().mockResolvedValue('TTRC/25-26/001001'),
}));

vi.mock('@/lib/razorpay', () => ({
  isRazorpayConfigured: vi.fn().mockReturnValue(true),
  verifyRazorpayWebhookSignature: vi.fn().mockReturnValue(true),
  getRazorpayClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/mongodb/models', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    OrderModel: {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn().mockResolvedValue({ acknowledged: true }),
      findOneAndUpdate: vi.fn(),
    },
    ProductModel: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn().mockResolvedValue({ acknowledged: true }),
      findOneAndUpdate: vi.fn(),
    },
    StockSubscriptionModel: {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
    CategoryModel: {
      findOne: vi.fn(),
    },
    AuditLogModel: {
      findOne: vi.fn(),
      create: vi.fn().mockResolvedValue(true),
    },
  };
});

describe('Next Release Features & Payment Reliability Hardening', () => {
  const WEBHOOK_SECRET = 'test_webhook_secret_key_123';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  function createSignedWebhookRequest(bodyObj: any) {
    const bodyText = JSON.stringify(bodyObj);
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex');

    return new Request('https://ttrc.store/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': signature,
        'content-type': 'application/json',
      },
      body: bodyText,
    });
  }

  // -------------------------------------------------------------------------
  // Feature 1: Product Documentation
  // -------------------------------------------------------------------------
  describe('Feature 1: Product Documentation', () => {
    it('Requires admin role to create product with documentation', async () => {
      const { requireAdmin } = await import('@/lib/auth-helpers');
      (requireAdmin as any).mockResolvedValueOnce({ error: 'Unauthorized: Admin role required.' });

      const res = await createProductAction({
        name: 'TTRC High-Torque Motor',
        slug: 'ttrc-high-torque-motor',
        productType: 'standard',
        pricePaise: 45000,
        stockQty: 10,
        imageUrls: ['https://example.com/motor.png'],
        documents: [
          {
            title: 'Motor Datasheet',
            file_url: 'https://example.com/datasheet.pdf',
            type: 'datasheet',
          },
        ],
      } as any);

      expect(res.error).toContain('Unauthorized');
    });

    it('Rejects invalid document metadata (missing title or invalid url)', async () => {
      const { requireAdmin } = await import('@/lib/auth-helpers');
      (requireAdmin as any).mockResolvedValueOnce({ user: { id: 'admin1', role: 'admin' } });

      const res = await createProductAction({
        name: 'TTRC Line Sensor 7-Array',
        slug: 'ttrc-line-sensor-7',
        productType: 'standard',
        pricePaise: 120000,
        stockQty: 15,
        imageUrls: ['https://example.com/sensor.png'],
        documents: [
          {
            title: '', // Invalid empty title
            file_url: 'https://example.com/sensor.pdf',
            type: 'datasheet',
          },
        ],
      } as any);

      expect(res.error).toBeDefined();
    });

    it('Successfully saves valid documents and in-box items', async () => {
      const { requireAdmin } = await import('@/lib/auth-helpers');
      const { ProductModel } = await import('@/lib/mongodb/models');

      (requireAdmin as any).mockResolvedValueOnce({ user: { id: 'admin1', role: 'admin' } });
      (ProductModel.findOne as any).mockResolvedValueOnce(null);
      (ProductModel.create as any).mockResolvedValueOnce({
        _id: 'prod_doc_1',
        name: 'TTRC LF 6.0 Kit',
        slug: 'ttrc-lf-6-kit',
        sku: 'TTRC-LF6-01',
        price: 330000,
        status: 'published',
      });

      const res = await createProductAction({
        name: 'TTRC LF 6.0 Kit',
        slug: 'ttrc-lf-6-kit',
        sku: 'TTRC-LF6-01',
        productType: 'kit',
        pricePaise: 330000,
        stockQty: 20,
        imageUrls: ['https://example.com/lf6.png'],
        documents: [
          {
            title: 'User Manual & Assembly Guide',
            file_url: 'https://example.com/manual.pdf',
            type: 'manual',
            version: 'v2.0',
          },
        ],
        in_box_items: [
          {
            item_name: 'FR4 Glass Epoxy Chassis Board',
            quantity: 1,
            notes: 'Pre-soldered',
          },
        ],
      } as any);

      expect(res.success).toBe(true);
      expect(ProductModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.arrayContaining([
            expect.objectContaining({ title: 'User Manual & Assembly Guide' }),
          ]),
          in_box_items: expect.arrayContaining([
            expect.objectContaining({ item_name: 'FR4 Glass Epoxy Chassis Board', quantity: 1 }),
          ]),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Feature 2: Typo-Tolerant Technical Search
  // -------------------------------------------------------------------------
  describe('Feature 2: Typo-Tolerant Technical Search', () => {
    it('Finds products using exact SKU search', async () => {
      const { ProductModel } = await import('@/lib/mongodb/models');
      (ProductModel.find as any).mockReturnValueOnce({
        limit: vi.fn().mockReturnValueOnce({
          lean: vi.fn().mockResolvedValueOnce([
            {
              _id: 'm1',
              name: 'TB6612FNG Dual Motor Driver',
              sku: 'TTRC-TB6612',
              slug: 'tb6612fng-motor-driver',
              price: 29900,
              stock_quantity: 40,
              is_active: true,
              status: 'published',
            },
          ]),
        }),
      });

      const results = await searchStoreProducts('TTRC-TB6612');
      expect(results.length).toBe(1);
      expect(results[0].sku).toBe('TTRC-TB6612');
    });

    it('Corrects common robotics typos (e.g. "ardunio" -> "arduino")', async () => {
      const { ProductModel } = await import('@/lib/mongodb/models');
      (ProductModel.find as any).mockReturnValueOnce({
        limit: vi.fn().mockReturnValueOnce({
          lean: vi.fn().mockResolvedValueOnce([
            {
              _id: 'm2',
              name: 'Arduino Nano Type-C Microcontroller',
              sku: 'ARD-NANO-C',
              slug: 'arduino-nano-type-c',
              price: 34900,
              stock_quantity: 50,
              is_active: true,
              status: 'published',
            },
          ]),
        }),
      });

      const results = await searchStoreProducts('ardunio nano');
      expect(results.length).toBe(1);
      expect(results[0].name).toContain('Arduino');
    });

    it('Never returns unpublished or inactive products through search', async () => {
      const { ProductModel } = await import('@/lib/mongodb/models');
      (ProductModel.find as any).mockReturnValueOnce({
        limit: vi.fn().mockReturnValueOnce({
          lean: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      await searchStoreProducts('prototype');
      expect(ProductModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          status: 'published',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Feature 3: Back-in-Stock Notifications
  // -------------------------------------------------------------------------
  describe('Feature 3: Back-in-Stock Notifications', () => {
    it('Normalizes email and creates active subscription when product is out of stock', async () => {
      const { ProductModel, StockSubscriptionModel } = await import('@/lib/mongodb/models');
      const { getAuthenticatedUser } = await import('@/lib/auth-helpers');

      (getAuthenticatedUser as any).mockResolvedValueOnce({ error: 'Unauthenticated' });
      (ProductModel.findById as any).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce({
          _id: 'prod_out_1',
          name: 'High Performance LiPo 3S 2200mAh',
          sku: 'LIPO-3S-2200',
          stock_quantity: 0, // genuinely unavailable
        }),
      });
      (StockSubscriptionModel.findOne as any).mockResolvedValueOnce(null);
      (StockSubscriptionModel.create as any).mockResolvedValueOnce({ _id: 'sub1' });

      const res = await subscribeBackInStockAction({
        productId: 'prod_out_1',
        email: '  STUDENT@RobotClub.org ',
      });

      expect(res.success).toBe(true);
      expect(StockSubscriptionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'student@robotclub.org',
          product_id: 'prod_out_1',
          status: 'active',
        })
      );
    });

    it('Informs user immediately if product is already in stock', async () => {
      const { ProductModel } = await import('@/lib/mongodb/models');
      (ProductModel.findById as any).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce({
          _id: 'prod_in_stock',
          name: 'Standard Servo Motor',
          stock_quantity: 12,
        }),
      });

      const res = await subscribeBackInStockAction({
        productId: 'prod_in_stock',
        email: 'test@example.com',
      });

      expect(res.alreadyInStock).toBe(true);
      expect(res.message).toContain('currently in stock');
    });

    it('Prevents duplicate active subscriptions for the same product and email', async () => {
      const { ProductModel, StockSubscriptionModel } = await import('@/lib/mongodb/models');
      (ProductModel.findById as any).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce({
          _id: 'prod_out_1',
          name: 'Out of Stock Motor',
          stock_quantity: 0,
        }),
      });
      (StockSubscriptionModel.findOne as any).mockResolvedValueOnce({
        _id: 'existing_sub',
        status: 'active',
      });

      const res = await subscribeBackInStockAction({
        productId: 'prod_out_1',
        email: 'duplicate@example.com',
      });

      expect(res.success).toBe(true);
      expect(res.alreadySubscribed).toBe(true);
      expect(StockSubscriptionModel.create).not.toHaveBeenCalled();
    });

    it('Dispatches notification on stock transition and marks status notified', async () => {
      const { StockSubscriptionModel } = await import('@/lib/mongodb/models');
      const { sendBackInStockEmail } = await import('@/lib/email/resend');

      (StockSubscriptionModel.find as any).mockResolvedValueOnce([
        {
          _id: 'sub_123',
          email: 'customer@example.com',
          status: 'active',
          unsubscribe_token: 'token123',
        },
      ]);
      (StockSubscriptionModel.findOneAndUpdate as any).mockResolvedValueOnce({
        _id: 'sub_123',
        email: 'customer@example.com',
        unsubscribe_token: 'token123',
      });

      const result = await notifySubscribersOnRestock(
        'prod_restocked_1',
        'TB6612FNG Motor Driver',
        'tb6612fng-motor-driver',
        29900
      );

      expect(result.notifiedCount).toBe(1);
      expect(sendBackInStockEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          toEmail: 'customer@example.com',
          productName: 'TB6612FNG Motor Driver',
        })
      );
    });

    it('Supports 1-click unsubscribe with secure token', async () => {
      const { StockSubscriptionModel } = await import('@/lib/mongodb/models');
      (StockSubscriptionModel.findOneAndUpdate as any).mockResolvedValueOnce({
        _id: 'sub_123',
        status: 'unsubscribed',
      });

      const res = await unsubscribeBackInStockAction('token123');
      expect(res.success).toBe(true);
      expect(res.message).toContain('unsubscribed');
    });
  });

  // -------------------------------------------------------------------------
  // Mandatory Reliability Review: Razorpay & Inventory Concurrency
  // -------------------------------------------------------------------------
  describe('Mandatory Reliability Review: Razorpay & Inventory Concurrency', () => {
    it('Delayed payment.failed webhook never cancels or restocks an already paid order', async () => {
      const { OrderModel, ProductModel, AuditLogModel } = await import('@/lib/mongodb/models');

      (AuditLogModel.findOne as any).mockResolvedValueOnce(null);
      // Order is already paid in MongoDB
      // findOneAndUpdate with status: 'pending', payment_status: 'pending' returns null
      (OrderModel.findOneAndUpdate as any).mockResolvedValueOnce(null);

      const req = createSignedWebhookRequest({
        event: 'payment.failed',
        event_id: 'evt_fail_late',
        payload: {
          payment: {
            entity: {
              id: 'pay_fail_late',
              order_id: 'order_rp_already_paid',
              status: 'failed',
            },
          },
        },
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      // ProductModel.findByIdAndUpdate should NEVER be called to restock items
      expect(ProductModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('Duplicate payment.failed webhooks only restock reserved inventory once', async () => {
      const { OrderModel, ProductModel, AuditLogModel } = await import('@/lib/mongodb/models');

      // First webhook call: transitions from pending -> cancelled
      (AuditLogModel.findOne as any).mockResolvedValueOnce(null);
      (OrderModel.findOneAndUpdate as any).mockResolvedValueOnce({
        _id: 'order_1',
        order_number: 'ORD-2026-0001',
        items: [{ product_id: 'prod_1', quantity: 2 }],
        save: vi.fn().mockResolvedValue(true),
      });

      const req1 = createSignedWebhookRequest({
        event: 'payment.failed',
        event_id: 'evt_fail_1',
        payload: { payment: { entity: { id: 'p1', order_id: 'order_rp_1' } } },
      });

      await webhookHandler(req1);
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);

      // Second duplicate webhook call: order is already cancelled, returns null
      (AuditLogModel.findOne as any).mockResolvedValueOnce(null);
      (OrderModel.findOneAndUpdate as any).mockResolvedValueOnce(null);

      const req2 = createSignedWebhookRequest({
        event: 'payment.failed',
        event_id: 'evt_fail_2',
        payload: { payment: { entity: { id: 'p1', order_id: 'order_rp_1' } } },
      });

      await webhookHandler(req2);
      // findByIdAndUpdate should still have been called only once total
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    });

    it('releasePendingOrderAction uses atomic findOneAndUpdate to prevent double restocking', async () => {
      const { OrderModel, ProductModel } = await import('@/lib/mongodb/models');
      const { getAuthenticatedUser } = await import('@/lib/auth-helpers');

      (getAuthenticatedUser as any).mockResolvedValueOnce({ error: 'Unauthenticated' });

      // First call succeeds atomically
      (OrderModel.findOneAndUpdate as any).mockResolvedValueOnce({
        _id: 'order_pending_123',
        order_number: 'ORD-2026-9999',
        items: [{ product_id: 'prod_xyz', quantity: 1 }],
        save: vi.fn().mockResolvedValue(true),
      });

      const res1 = await releasePendingOrderAction('order_pending_123', 'guest@example.com');
      expect(res1.success).toBe(true);
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);

      // Concurrent second call receives null from findOneAndUpdate
      (getAuthenticatedUser as any).mockResolvedValueOnce({ error: 'Unauthenticated' });
      (OrderModel.findOneAndUpdate as any).mockResolvedValueOnce(null);

      const res2 = await releasePendingOrderAction('order_pending_123', 'guest@example.com');
      expect(res2.error).toContain('not found or already completed');
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledTimes(1); // Not called again
    });

    it('cleanupExpiredPendingOrdersAction releases stale pending orders safely', async () => {
      const { OrderModel, ProductModel } = await import('@/lib/mongodb/models');

      (OrderModel.find as any).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce([
          { _id: 'expired_order_1', items: [{ product_id: 'prod_p1', quantity: 3 }] },
        ]),
      });

      (OrderModel.findOneAndUpdate as any).mockResolvedValueOnce({
        _id: 'expired_order_1',
        items: [{ product_id: 'prod_p1', quantity: 3 }],
      });

      const res = await cleanupExpiredPendingOrdersAction(30);
      expect(res.success).toBe(true);
      expect(res.releasedCount).toBe(1);
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('prod_p1', {
        $inc: { stock_quantity: 3 },
      });
    });
  });
});
