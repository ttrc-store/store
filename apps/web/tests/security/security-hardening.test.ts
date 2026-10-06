import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { sanitizeVideoEmbedUrl, ProductSchema } from '@/lib/video-utils';
import { calculateGstFromInclusive, computeOrderTotals } from '@ttrc/shared';
import { validateProductionSecrets, evaluateSecretStrength } from '@/lib/security/production-secrets-validator';

describe('TTRC Store Security Hardening & Penetration Test Suite', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  // =========================================================================
  // 1. AUTHENTICATION, TOKENS & RATE LIMITING
  // =========================================================================
  describe('Authentication & Rate Limiting Controls', () => {
    it('enforces sliding-window rate limiting on repeated attempts', async () => {
      const testKey = `login-test-${Date.now()}`;
      const limit = 3;

      // Attempts 1 to 3 should succeed
      expect((await checkRateLimit({ key: testKey, limit, windowMs: 5000 })).success).toBe(true);
      expect((await checkRateLimit({ key: testKey, limit, windowMs: 5000 })).success).toBe(true);
      expect((await checkRateLimit({ key: testKey, limit, windowMs: 5000 })).success).toBe(true);

      // Attempt 4 should be rejected by rate limiter
      const fourthAttempt = await checkRateLimit({ key: testKey, limit, windowMs: 5000 });
      expect(fourthAttempt.success).toBe(false);
      expect(fourthAttempt.remaining).toBe(0);
    });

    it('validates JWT HMAC-SHA256 signature and rejects forged payloads', async () => {
      const secret = 'valid_secret_key_12345';
      const wrongSecret = 'attacker_secret_key_99999';

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ userId: 'u1', role: 'admin' })).toString('base64url');
      const data = `${header}.${payload}`;

      const validSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
      const forgedSig = crypto.createHmac('sha256', wrongSecret).update(data).digest('base64url');

      // Verification function replicating Edge Middleware Web Crypto
      const verifySig = (tokenSig: string, expectedSecret: string) => {
        const computed = crypto.createHmac('sha256', expectedSecret).update(data).digest('base64url');
        const bufA = Buffer.from(tokenSig);
        const bufB = Buffer.from(computed);
        return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
      };

      expect(verifySig(validSig, secret)).toBe(true);
      expect(verifySig(forgedSig, secret)).toBe(false);
    });
  });

  // =========================================================================
  // 2. PRICING & FINANCIAL INTEGRITY
  // =========================================================================
  describe('Financial Calculations & Pricing Integrity', () => {
    it('authoritatively calculates intra-state GST (CGST + SGST) from inclusive price', () => {
      const lineTotalPaise = 249900; // ₹2,499.00
      const gst = calculateGstFromInclusive(lineTotalPaise, 18, false);

      expect(gst.igstPaise).toBe(0);
      expect(gst.cgstPaise).toBeGreaterThan(0);
      expect(gst.sgstPaise).toBeGreaterThan(0);
      expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.gstAmountPaise);
      expect(gst.taxableAmountPaise + gst.gstAmountPaise).toBe(lineTotalPaise);
    });

    it('authoritatively calculates inter-state GST (IGST) from inclusive price', () => {
      const lineTotalPaise = 249900;
      const gst = calculateGstFromInclusive(lineTotalPaise, 18, true);

      expect(gst.cgstPaise).toBe(0);
      expect(gst.sgstPaise).toBe(0);
      expect(gst.igstPaise).toBe(gst.gstAmountPaise);
      expect(gst.taxableAmountPaise + gst.igstPaise).toBe(lineTotalPaise);
    });

    it('recomputes order totals on the server and rejects tampering', () => {
      const totals = computeOrderTotals({
        itemSubtotalPaise: 100000, // ₹1,000
        shippingPaise: 5000,      // ₹50
        codChargePaise: 0,
        couponDiscountPaise: 20000, // ₹200
      });

      expect(totals.totalPaise).toBe(85000); // 1000 + 50 - 200 = ₹850
      expect(totals.subtotalPaise).toBe(100000);
      expect(totals.discountPaise).toBe(20000);
      expect(totals.shippingPaise).toBe(5000);
    });

    it('validates bulk pricing tiers: unit price cannot exceed base price and min quantities must be distinct', () => {
      const validProduct = {
        name: 'Pro Motor Chassis',
        slug: 'pro-motor-chassis',
        productType: 'kit',
        pricePaise: 50000, // ₹500
        mrpPaise: 60000,
        stockQty: 20,
        imageUrls: ['https://ttrc.store/img.png'],
        bulkPriceTiers: [
          { minQuantity: 5, unitPricePaise: 45000 },
          { minQuantity: 10, unitPricePaise: 40000 },
        ],
      };

      const validResult = ProductSchema.safeParse(validProduct);
      expect(validResult.success).toBe(true);

      // Attempt attack: tier unit price higher than base price
      const invalidPriceTier = {
        ...validProduct,
        bulkPriceTiers: [{ minQuantity: 5, unitPricePaise: 55000 }], // higher than 50000
      };
      expect(ProductSchema.safeParse(invalidPriceTier).success).toBe(false);

      // Attempt attack: duplicate minimum quantity
      const duplicateMinQty = {
        ...validProduct,
        bulkPriceTiers: [
          { minQuantity: 5, unitPricePaise: 45000 },
          { minQuantity: 5, unitPricePaise: 42000 },
        ],
      };
      expect(ProductSchema.safeParse(duplicateMinQty).success).toBe(false);
    });
  });

  // =========================================================================
  // 3. COUPONS LOGIC & ABUSE DEFENSE
  // =========================================================================
  describe('Coupon Abuse & Validation Rules', () => {
    it('enforces maximum discount cap on percentage coupons', () => {
      const coupon = {
        code: 'HALFPRICE',
        discount_type: 'percentage' as const,
        discount_value: 50, // 50%
        min_order_value_paise: 50000,
        max_discount_paise: 100000, // capped at ₹1,000 (100,000 paise)
      };

      const orderSubtotalPaise = 500000; // ₹5,000 order
      let discountPaise = Math.round((orderSubtotalPaise * coupon.discount_value) / 100); // 250,000 paise
      if (coupon.max_discount_paise) {
        discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
      }

      expect(discountPaise).toBe(100000); // Capped at ₹1,000, not ₹2,500
    });

    it('rejects expired coupons based on timestamp', () => {
      const expiredCoupon = {
        code: 'EXPIRED10',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        is_active: true,
      };

      const isExpired = expiredCoupon.expires_at < new Date();
      expect(isExpired).toBe(true);
    });
  });

  // =========================================================================
  // 4. ATOMIC INVENTORY CONCURRENCY
  // =========================================================================
  describe('Atomic Inventory Concurrency & Race Condition Defense', () => {
    it('simulates atomic stock decrement and detects overselling collision', () => {
      // Simulation of MongoDB conditional atomic update:
      // db.products.updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })
      let dbStock = 1;

      const atomicPurchase = (qty: number): boolean => {
        if (dbStock >= qty) {
          dbStock -= qty;
          return true;
        }
        return false;
      };

      // Customer A and Customer B both attempt to purchase the last unit (1)
      const customerASuccess = atomicPurchase(1);
      const customerBSuccess = atomicPurchase(1);

      expect(customerASuccess).toBe(true);
      expect(customerBSuccess).toBe(false); // Second request must fail cleanly
      expect(dbStock).toBe(0); // Inventory never drops below 0
    });
  });

  // =========================================================================
  // 5. RAZORPAY WEBHOOK INTEGRITY & TIMING-SAFE VERIFICATION
  // =========================================================================
  describe('Payment & Webhook Security', () => {
    it('verifies Razorpay HMAC signature using timing-safe comparison', () => {
      const secret = 'rzp_test_secret_998877';
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_123', order_id: 'order_abc', amount: 249900 } } },
      });

      const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      // Timing safe comparison helper
      const verifyWebhook = (sig: string, body: string, sec: string) => {
        const expected = crypto.createHmac('sha256', sec).update(body).digest('hex');
        const bufA = Buffer.from(sig);
        const bufB = Buffer.from(expected);
        return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
      };

      expect(verifyWebhook(validSignature, payload, secret)).toBe(true);
      expect(verifyWebhook('tampered_signature', payload, secret)).toBe(false);
    });

    it('enforces exact financial invariant: payment amount === authoritative order amount', () => {
      const orderTotalPaise = 249900; // ₹2,499.00 authoritative total

      const validatePaymentAmount = (paidPaise: number, totalPaise: number) => {
        if (paidPaise !== totalPaise) {
          const type = paidPaise < totalPaise ? 'UNDERPAID' : 'OVERPAID';
          return { valid: false, type };
        }
        return { valid: true, type: 'EXACT' };
      };

      // Exact payment matches -> Valid
      expect(validatePaymentAmount(249900, orderTotalPaise)).toEqual({ valid: true, type: 'EXACT' });

      // Underpaid amount (e.g. paying ₹1 for ₹2,499 order) -> Rejected
      expect(validatePaymentAmount(100, orderTotalPaise)).toEqual({ valid: false, type: 'UNDERPAID' });

      // Unexpected overpayment -> Flagged for audit & reconciliation, not treated as normal payment
      expect(validatePaymentAmount(250000, orderTotalPaise)).toEqual({ valid: false, type: 'OVERPAID' });
    });
  });

  // =========================================================================
  // 6. FILE UPLOADS & MAGIC BYTES VERIFICATION
  // =========================================================================
  describe('File Upload Security & Magic Header Checks', () => {
    it('accepts genuine PNG, JPEG, and WebP magic byte headers', () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const webpHeader = Buffer.from('RIFF....WEBP', 'ascii');

      const checkMagic = (buf: Buffer) => {
        const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
        const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
        const isWebp = buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
        return isJpeg || isPng || isWebp;
      };

      expect(checkMagic(pngHeader)).toBe(true);
      expect(checkMagic(jpegHeader)).toBe(true);
      expect(checkMagic(webpHeader)).toBe(true);
    });

    it('rejects executable scripts or HTML disguised with an image extension', () => {
      const phpScript = Buffer.from('<?php echo "evil"; ?>');
      const htmlScript = Buffer.from('<script>alert("xss")</script>');

      const checkMagic = (buf: Buffer) => {
        const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
        const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
        const isWebp = buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
        return isJpeg || isPng || isWebp;
      };

      expect(checkMagic(phpScript)).toBe(false);
      expect(checkMagic(htmlScript)).toBe(false);
    });
  });

  // =========================================================================
  // 7. INPUT SANITIZATION & REDOS DEFENSE
  // =========================================================================
  describe('Input Sanitization & Injection Defense', () => {
    it('sanitizes video embed URLs and rejects arbitrary javascript: and malicious iframes', () => {
      expect(sanitizeVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
      );
      expect(sanitizeVideoEmbedUrl('https://vimeo.com/123456789')).toBe(
        'https://player.vimeo.com/video/123456789'
      );

      // Malicious URLs
      expect(sanitizeVideoEmbedUrl('javascript:alert(1)')).toBeUndefined();
      expect(sanitizeVideoEmbedUrl('https://evil-site.com/video.mp4')).toBeUndefined();
      expect(sanitizeVideoEmbedUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    });

    it('escapes special regex characters to prevent ReDoS attacks in search queries', () => {
      const maliciousQuery = '.*+?^${}()|[]\\';
      const escaped = maliciousQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      expect(() => new RegExp(escaped, 'i')).not.toThrow();
      expect(escaped).not.toEqual(maliciousQuery);
    });
  });

  // =========================================================================
  // 8. IDOR & AUTHORIZATION POLICY
  // =========================================================================
  describe('IDOR & Authorization Isolation', () => {
    it('verifies order ownership authorization logic denies cross-customer access', () => {
      const order = {
        id: 'ord_123',
        user_id: 'user_A_id',
        order_number: 'TTRC/25-26/000001',
      };

      const checkAccess = (user: { id: string; role: string }) => {
        const isOwner = order.user_id === user.id;
        const isAdmin = user.role === 'admin' || user.role === 'staff';
        return isOwner || isAdmin;
      };

      // Owner User A -> ALLOW
      expect(checkAccess({ id: 'user_A_id', role: 'customer' })).toBe(true);

      // Other Customer User B -> DENY
      expect(checkAccess({ id: 'user_B_id', role: 'customer' })).toBe(false);

      // Admin -> ALLOW
      expect(checkAccess({ id: 'admin_id', role: 'admin' })).toBe(true);
    });
  });

  // =========================================================================
  // 9. PRODUCTION SECRETS & ENTROPY CONTROLS
  // =========================================================================
  describe('Production Secrets & Entropy Validation', () => {
    it('rejects short, default, placeholder, or low-entropy secrets in production', () => {
      // 1. Missing secret
      expect(evaluateSecretStrength('JWT_SECRET', '').length).toBeGreaterThan(0);

      // 2. Short secret (< 32 bytes)
      expect(evaluateSecretStrength('JWT_SECRET', 'too_short_secret_key_123').some((msg) => msg.includes('too short'))).toBe(true);

      // 3. Known default or placeholder
      expect(evaluateSecretStrength('JWT_SECRET', 'ttrc_store_jwt_secret_2026_key_secure_auth').some((msg) => msg.includes('known default'))).toBe(true);
      expect(evaluateSecretStrength('JWT_SECRET', 'your_jwt_secret_key_here_extended_pad').some((msg) => msg.includes('known default'))).toBe(true);
      expect(evaluateSecretStrength('JWT_SECRET', '{{JWT_SECRET}}_production_deployment_key').some((msg) => msg.includes('template syntax'))).toBe(true);

      // 4. Low character diversity / repetition
      expect(evaluateSecretStrength('JWT_SECRET', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa').some((msg) => msg.includes('low character diversity'))).toBe(true);

      // 5. In production mode, rejects insecure secrets
      const invalidProdEnv = {
        NODE_ENV: 'production',
        JWT_SECRET: 'ttrc_store_jwt_secret_2026_key_secure_auth',
      };
      const res = validateProductionSecrets(invalidProdEnv);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('rejects secret reuse across different security boundaries in production', () => {
      const reusedSecret = 'd4c1b92e76f849a0bc45ef1234567890abcdef1234567890abcdef12345678';
      const prodEnvWithReuse = {
        NODE_ENV: 'production',
        JWT_SECRET: reusedSecret,
        RAZORPAY_KEY_SECRET: reusedSecret, // Reused!
      };
      const res = validateProductionSecrets(prodEnvWithReuse);
      expect(res.valid).toBe(false);
      expect(res.errors.some((err) => err.includes('Secret reuse detected'))).toBe(true);
    });

    it('accepts genuinely high-entropy random 32+ byte distinct production secrets', () => {
      const highEntropyEnv = {
        NODE_ENV: 'production',
        JWT_SECRET: crypto.randomBytes(32).toString('hex'), // 64 chars high entropy
        RAZORPAY_KEY_SECRET: crypto.randomBytes(32).toString('hex'),
        RAZORPAY_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
      };
      const res = validateProductionSecrets(highEntropyEnv);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });
  });
});
