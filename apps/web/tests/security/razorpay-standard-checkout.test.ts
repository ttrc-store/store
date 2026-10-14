import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpaySignature, isRazorpayConfigured } from '@/lib/razorpay';
import { POST as createOrderHandler } from '@/app/api/create-order/route';
import { POST as verifyPaymentHandler } from '@/app/api/verify-payment/route';

describe('Razorpay Standard Web Checkout Integration', () => {
  const TEST_KEY_ID = 'rzp_test_TnRvg3LwstLPha';
  const TEST_KEY_SECRET = 'LvVumP5Na4NILc9zLYFbtC0Z';

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = TEST_KEY_ID;
  });

  describe('lib/razorpay utility', () => {
    it('confirms Razorpay is configured when env vars are present', () => {
      expect(isRazorpayConfigured()).toBe(true);
    });

    it('verifies valid HMAC-SHA256 signature', () => {
      const orderId = 'order_test_12345';
      const paymentId = 'pay_test_67890';
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it('rejects tampered or forged signatures', () => {
      const orderId = 'order_test_12345';
      const paymentId = 'pay_test_67890';
      const forgedSignature = crypto
        .createHmac('sha256', 'wrong_secret_key')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature: forgedSignature,
      });

      expect(isValid).toBe(false);
    });

    it('rejects empty or missing parameters', () => {
      expect(
        verifyRazorpaySignature({
          orderId: '',
          paymentId: 'pay_123',
          signature: 'sig_123',
        })
      ).toBe(false);

      expect(
        verifyRazorpaySignature({
          orderId: 'order_123',
          paymentId: '',
          signature: 'sig_123',
        })
      ).toBe(false);

      expect(
        verifyRazorpaySignature({
          orderId: 'order_123',
          paymentId: 'pay_123',
          signature: '',
        })
      ).toBe(false);
    });
  });

  describe('POST /api/create-order', () => {
    it('rejects amount under 100 paise (< ₹1.00)', async () => {
      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50, isDevTest: true }),
      });

      const res = await createOrderHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/minimum 100 paise/i);
    });

    it('rejects missing or non-numeric amount in dev test mode', async () => {
      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'INR', isDevTest: true }),
      });

      const res = await createOrderHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Valid test amount in paise/);
    });
  });

  describe('POST /api/verify-payment', () => {
    it('returns 400 when missing required fields', async () => {
      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_123',
          // missing razorpay_payment_id and razorpay_signature
        }),
      });

      const res = await verifyPaymentHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Missing required payment verification fields/);
    });

    it('returns 400 when signature mismatch occurs', async () => {
      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'invalid_tampered_signature_hex_00000000000000000000000000000000',
          isDevTest: true,
        }),
      });

      const res = await verifyPaymentHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/signature mismatch/);
    });

    it('returns 200 OK and verified: true when HMAC signature matches', async () => {
      const orderId = 'order_valid_789';
      const paymentId = 'pay_valid_101';
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
          isDevTest: true,
        }),
      });

      const res = await verifyPaymentHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.verified).toBe(true);
      expect(json.order_id).toBe(orderId);
      expect(json.payment_id).toBe(paymentId);
    });
  });
});
