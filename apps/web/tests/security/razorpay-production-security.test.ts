import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpaySignature, isRazorpayConfigured } from '@/lib/razorpay';
import { POST as createOrderHandler } from '@/app/api/create-order/route';
import { POST as verifyPaymentHandler } from '@/app/api/verify-payment/route';
import { POST as webhookHandler } from '@/app/api/webhooks/razorpay/route';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/mongodb/models', () => {
  const mockOrder: any = {
    _id: 'order_mongo_id_123',
    order_number: 'ORD-2026-0001',
    user_id: 'user_cust_A',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'razorpay',
    total: 319900, // ₹3,199.00
    razorpay_order_id: 'order_rp_legit_123',
    save: vi.fn().mockResolvedValue(true),
  };

  return {
    OrderModel: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
    AuditLogModel: {
      findOne: vi.fn(),
      create: vi.fn().mockResolvedValue(true),
    },
  };
});

vi.mock('@/lib/razorpay', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getRazorpayClient: vi.fn(),
  };
});

import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { OrderModel, AuditLogModel } from '@/lib/mongodb/models';
import { getRazorpayClient } from '@/lib/razorpay';

describe('TTRC Store - Razorpay Production Payment Security Audit Tests', () => {
  const TEST_KEY_ID = 'rzp_test_TnRvg3LwstLPha';
  const TEST_KEY_SECRET = 'LvVumP5Na4NILc9zLYFbtC0Z';
  const TEST_WEBHOOK_SECRET = 'LvVumP5Na4NILc9zLYFbtC0Z';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    (process.env as any).NODE_ENV = 'development';
  });

  describe('1. Server-Authoritative Order Creation Security (/api/create-order)', () => {
    it('PREVENTS PRICE MANIPULATION: Ignores client-supplied amount and enforces DB total', async () => {
      // Mock authenticated customer A
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'user_cust_A', email: 'custA@ttrc.store', role: 'customer' },
      });

      // Mock database order: ₹3,199.00 (319900 paise)
      const mockDbOrder = {
        _id: 'mongo_order_1',
        order_number: 'ORD-2026-0001',
        user_id: 'user_cust_A',
        total: 319900,
        status: 'pending',
        payment_status: 'pending',
        save: vi.fn().mockResolvedValue(true),
      };
      (OrderModel.findOne as any).mockResolvedValue(mockDbOrder);

      const mockRpOrderCreate = vi.fn().mockResolvedValue({
        id: 'order_rp_created_123',
        amount: 319900,
        currency: 'INR',
        receipt: 'ORD-2026-0001',
      });
      (getRazorpayClient as any).mockReturnValue({
        orders: { create: mockRpOrderCreate },
      });

      // Attacker tries to send amount = 100 paise (₹1) to bypass paying ₹3,199
      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'ORD-2026-0001',
          amount: 100, // Attacker's manipulated amount
        }),
      });

      const res = await createOrderHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // The Razorpay order MUST be created with the server DB amount (319900), NOT client's 100!
      expect(mockRpOrderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 319900,
          currency: 'INR',
        })
      );
    });

    it('REJECTS unauthenticated requests', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        error: 'No active session found',
      });

      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: 'ORD-2026-0001' }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(401);
    });

    it('PREVENTS IDOR: Customer A cannot create payment for Customer B order', async () => {
      // Authenticated as Customer A
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'user_cust_A', role: 'customer' },
      });

      // Order belongs to Customer B
      (OrderModel.findOne as any).mockResolvedValue({
        _id: 'mongo_order_2',
        order_number: 'ORD-2026-0002',
        user_id: 'user_cust_B', // Different customer!
        total: 500000,
        status: 'pending',
      });

      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: 'ORD-2026-0002' }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Unauthorized/);
    });
  });

  describe('2. Authoritative Payment Verification (/api/verify-payment)', () => {
    it('REJECTS payment verification if Customer A tries to verify Customer B order', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'user_cust_A', role: 'customer' },
      });

      (OrderModel.findOne as any).mockResolvedValue({
        _id: 'mongo_order_3',
        order_number: 'ORD-2026-0003',
        user_id: 'user_cust_B', // Different customer
        total: 200000,
        razorpay_order_id: 'order_rp_3',
      });

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'ORD-2026-0003',
          razorpay_order_id: 'order_rp_3',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'sig_123',
        }),
      });

      const res = await verifyPaymentHandler(req);
      expect(res.status).toBe(403);
    });

    it('REJECTS verification if Razorpay order ID does not match internal order record', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'user_cust_A', role: 'customer' },
      });

      (OrderModel.findOne as any).mockResolvedValue({
        _id: 'mongo_order_4',
        order_number: 'ORD-2026-0004',
        user_id: 'user_cust_A',
        total: 200000,
        razorpay_order_id: 'order_rp_LEGIT_EXPECTED',
      });

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'ORD-2026-0004',
          razorpay_order_id: 'order_rp_FORGED_DIFFERENT',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'sig_123',
        }),
      });

      const res = await verifyPaymentHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/order ID mismatch/i);
    });

    it('REJECTS verification if payment amount on Razorpay mismatches order total', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'user_cust_A', role: 'customer' },
      });

      const orderId = 'order_rp_amount_test';
      const paymentId = 'pay_amount_test';
      const validSig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      (OrderModel.findOne as any).mockResolvedValue({
        _id: 'mongo_order_5',
        order_number: 'ORD-2026-0005',
        user_id: 'user_cust_A',
        total: 500000, // Expected ₹5,000 (500000 paise)
        razorpay_order_id: orderId,
        save: vi.fn(),
      });

      // Gateway returns underpayment of 100 paise
      (getRazorpayClient as any).mockReturnValue({
        payments: {
          fetch: vi.fn().mockResolvedValue({
            id: paymentId,
            order_id: orderId,
            amount: 100, // UNDERPAID!
            currency: 'INR',
            status: 'captured',
          }),
        },
      });

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'ORD-2026-0005',
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSig,
        }),
      });

      const res = await verifyPaymentHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Payment amount mismatch/);
    });

    it('HANDLES IDEMPOTENCY: Repeat calls for already-paid order return 200 without duplicate mutation', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: { id: 'user_cust_A', role: 'customer' },
      });

      const mockSave = vi.fn();
      (OrderModel.findOne as any).mockResolvedValue({
        _id: 'mongo_order_6',
        order_number: 'ORD-2026-0006',
        user_id: 'user_cust_A',
        payment_status: 'paid', // Already paid
        razorpay_order_id: 'order_rp_6',
        razorpay_payment_id: 'pay_already_captured_6',
        save: mockSave,
      });

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'ORD-2026-0006',
          razorpay_order_id: 'order_rp_6',
          razorpay_payment_id: 'pay_already_captured_6',
          razorpay_signature: 'sig_dummy',
        }),
      });

      const res = await verifyPaymentHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.idempotent).toBe(true);
      expect(mockSave).not.toHaveBeenCalled(); // No duplicate DB write!
    });
  });

  describe('3. Webhook Integrity & Replay Protection (/api/webhooks/razorpay)', () => {
    it('REJECTS webhook with invalid signature', async () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'invalid_forged_webhook_signature',
        },
        body: payload,
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid signature/);
    });

    it('PREVENTS REPLAY ATTACKS: Skips already processed webhook eventId', async () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        event_id: 'evt_test_already_processed',
        payload: {
          payment: { entity: { id: 'pay_123', order_id: 'order_123', amount: 319900 } },
        },
      });

      const validSig = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      // Existing audit log exists for this event_id
      (AuditLogModel.findOne as any).mockResolvedValue({
        _id: 'log_existing_1',
        action: 'webhook.razorpay.payment.captured',
      });

      const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSig,
        },
        body: payload,
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.idempotent).toBe(true);
    });
  });

  describe('4. Environment & Test Route Lockdown', () => {
    it('RESTRICTS developer test payment creation in production', async () => {
      (process.env as any).NODE_ENV = 'production';

      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDevTest: true,
          amount: 100,
        }),
      });

      const res = await createOrderHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/disabled in production/);
    });

    it('RESTRICTS developer test payment verification in production', async () => {
      (process.env as any).NODE_ENV = 'production';

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDevTest: true,
          order_id: 'order_test',
          payment_id: 'pay_test',
          signature: 'sig_test',
        }),
      });

      const res = await verifyPaymentHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/disabled in production/);
    });
  });
});
