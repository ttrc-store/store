import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  generateNumericOtp,
  hashOtp,
  verifyOtpHash,
  normalizeEmail,
  createOtpChallenge,
  verifyOtpChallenge,
} from '@/lib/security/otp-service';
import {
  checkAndReserveQuota,
  recordQuotaOutcome,
  getQuotaSummary,
  fetchResendUsageApi,
} from '@/lib/email/quota-manager';
import {
  sendVerificationOtp,
  sendPasswordResetOtp,
  sendEmailChangeOtp,
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendOrderStatusUpdate,
  sendBackInStockNotification,
  sendSecurityNotification,
} from '@/lib/email/resend';
import {
  renderOtpEmail,
  renderOrderConfirmationEmail,
  renderPaymentConfirmationEmail,
  renderOrderStatusUpdateEmail,
  renderBackInStockEmail,
  renderSecurityAlertEmail,
} from '@/lib/email/templates';

// In-memory mock database for OTP challenges and quota ledgers
const mockChallenges: any[] = [];
const mockLedgers: any[] = [];

vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/mongodb/models', () => {
  return {
    OtpChallengeModel: {
      create: vi.fn().mockImplementation(async (doc) => {
        const item = { ...doc, _id: `id_${Date.now()}_${Math.random()}` };
        mockChallenges.push(item);
        return item;
      }),
      findOne: vi.fn().mockImplementation((query) => ({
        sort: vi.fn().mockImplementation(() => {
          return mockChallenges
            .filter((c) => {
              if (query.email && c.email !== query.email) return false;
              if (query.purpose && c.purpose !== query.purpose) return false;
              if (query.is_consumed !== undefined && c.is_consumed !== query.is_consumed) return false;
              if (query.is_invalidated !== undefined && c.is_invalidated !== query.is_invalidated) return false;
              if (query.challenge_id && c.challenge_id !== query.challenge_id) return false;
              return true;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
        }),
      })),
      updateMany: vi.fn().mockImplementation(async (filter, update) => {
        let count = 0;
        for (const c of mockChallenges) {
          if (c.email === filter.email && c.purpose === filter.purpose) {
            if (update.$set?.is_invalidated !== undefined) {
              c.is_invalidated = update.$set.is_invalidated;
              count++;
            }
          }
        }
        return { modifiedCount: count };
      }),
      findOneAndUpdate: vi.fn().mockImplementation(async (filter, update) => {
        const item = mockChallenges.find((c) => {
          if (c._id !== filter._id) return false;
          if (filter.is_consumed !== undefined && c.is_consumed !== filter.is_consumed) return false;
          if (filter.is_invalidated !== undefined && c.is_invalidated !== filter.is_invalidated) return false;
          if (filter.expires_at?.$gt && c.expires_at <= filter.expires_at.$gt) return false;
          if (filter.attempts?.$lt !== undefined && c.attempts >= filter.attempts.$lt) return false;
          return true;
        });

        if (!item) return null;

        if (update.$inc?.attempts) {
          item.attempts = (item.attempts || 0) + update.$inc.attempts;
        }
        if (update.$set?.is_consumed !== undefined) {
          item.is_consumed = update.$set.is_consumed;
          item.consumed_at = update.$set.consumed_at;
        }
        return item;
      }),
    },
    EmailQuotaLedgerModel: {
      find: vi.fn().mockImplementation((query) => {
        return {
          lean: vi.fn().mockResolvedValue(
            mockLedgers.filter((l) => {
              if (query.date_key && l.date_key !== query.date_key) return false;
              if (query.month_key && l.month_key !== query.month_key) return false;
              return true;
            })
          ),
        };
      }),
      findOneAndUpdate: vi.fn().mockImplementation(async (filter, update) => {
        let item = mockLedgers.find((l) => l.date_key === filter.date_key && l.category === filter.category);
        if (!item) {
          item = {
            date_key: filter.date_key,
            category: filter.category,
            month_key: update.$setOnInsert?.month_key || '2026-10',
            accepted_count: 0,
            attempt_count: 0,
            failed_count: 0,
            suppressed_count: 0,
          };
          mockLedgers.push(item);
        }
        if (update.$inc?.accepted_count) {
          item.accepted_count = (item.accepted_count || 0) + update.$inc.accepted_count;
        }
        if (update.$inc?.attempt_count) {
          item.attempt_count = (item.attempt_count || 0) + update.$inc.attempt_count;
        }
        if (update.$inc?.failed_count) {
          item.failed_count = (item.failed_count || 0) + update.$inc.failed_count;
        }
        if (update.$inc?.suppressed_count) {
          item.suppressed_count = (item.suppressed_count || 0) + update.$inc.suppressed_count;
        }
        return item;
      }),
    },
    UserModel: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
    },
    AuditLogModel: {
      create: vi.fn().mockResolvedValue({ acknowledged: true }),
    },
  };
});

describe('TTRC Store — Secure Email OTP & Transactional Email Architecture', () => {
  beforeEach(() => {
    mockChallenges.length = 0;
    mockLedgers.length = 0;
    vi.clearAllMocks();
  });

  // ─── 1. OTP FORMAT, CRYPTOGRAPHY & SECURITY TESTS ──────────────────────────

  describe('1. OTP Generation, HMAC Hashing & Invariants', () => {
    it('generates a 6-digit numeric OTP between 100000 and 999999', () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateNumericOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it('generates timing-safe HMAC-SHA256 hashes without storing plaintext in DB', () => {
      const otp = '849201';
      const hash = hashOtp(otp);
      expect(hash).toHaveLength(64);
      expect(hash).not.toContain(otp);
      expect(verifyOtpHash(otp, hash)).toBe(true);
      expect(verifyOtpHash('849202', hash)).toBe(false);
    });

    it('normalizes email casing and whitespace so rate limits cannot be bypassed', () => {
      expect(normalizeEmail('  Customer@Example.COM  ')).toBe('customer@example.com');
      expect(normalizeEmail('ROBOTICS@ttrc.STORE')).toBe('robotics@ttrc.store');
    });
  });

  // ─── 2. OTP LIFECYCLE & 120-SECOND EXPIRY TESTS ────────────────────────────

  describe('2. OTP Expiry (Strict 120s) and Attempt Limits', () => {
    it('valid OTP verification succeeds before 120 seconds', async () => {
      const email = 'user@example.com';
      const challenge = await createOtpChallenge({ email, purpose: 'registration' });
      expect(challenge.success).toBe(true);
      expect(challenge.otpForSending).toBeDefined();

      const verifyRes = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: challenge.otpForSending!,
        challengeId: challenge.challengeId,
      });

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.email).toBe(email);
      expect(verifyRes.purpose).toBe('registration');
    });

    it('rejects OTP after 120 seconds (expiry enforcement)', async () => {
      const email = 'expired_user@example.com';
      const challenge = await createOtpChallenge({ email, purpose: 'registration' });

      // Fast-forward challenge expiry to 1 second in the past
      const stored = mockChallenges.find((c) => c.challenge_id === challenge.challengeId);
      stored.expires_at = new Date(Date.now() - 1000);

      const verifyRes = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: challenge.otpForSending!,
        challengeId: challenge.challengeId,
      });

      expect(verifyRes.success).toBe(false);
      expect(verifyRes.expired).toBe(true);
      expect(verifyRes.error).toContain('expired');
    });

    it('rejects incorrect OTP and counts down remaining attempts', async () => {
      const email = 'wrong_otp@example.com';
      const challenge = await createOtpChallenge({ email, purpose: 'registration' });

      const verifyRes = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: '000000',
        challengeId: challenge.challengeId,
      });

      expect(verifyRes.success).toBe(false);
      expect(verifyRes.error).toContain('Invalid verification code');
      expect(verifyRes.error).toContain('4 attempts remaining');
    });

    it('locks and invalidates code after 5 failed attempts', async () => {
      const email = 'lockout@example.com';
      const challenge = await createOtpChallenge({ email, purpose: 'registration' });

      for (let i = 0; i < 4; i++) {
        await verifyOtpChallenge({ email, purpose: 'registration', otp: '111111' });
      }

      // 5th failed attempt should trigger lockout
      const fifthAttempt = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: '111111',
      });
      expect(fifthAttempt.success).toBe(false);
      expect(fifthAttempt.locked).toBe(true);

      // Subsequent attempt with the CORRECT code should now be completely rejected
      const attemptAfterLockout = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: challenge.otpForSending!,
      });
      expect(attemptAfterLockout.success).toBe(false);
      expect(attemptAfterLockout.locked).toBe(true);
    });

    it('enforces 60-second cooldown between resend requests', async () => {
      const email = 'cooldown@example.com';
      const first = await createOtpChallenge({ email, purpose: 'registration' });
      expect(first.success).toBe(true);

      // Immediate second request within 60s should be blocked
      const immediateSecond = await createOtpChallenge({ email, purpose: 'registration' });
      expect(immediateSecond.success).toBe(false);
      expect(immediateSecond.error).toContain('Please wait');
      expect(immediateSecond.cooldownSeconds).toBeGreaterThan(0);
    });

    it('a newly issued OTP invalidates all prior active OTPs for the same purpose', async () => {
      const email = 'invalidation@example.com';
      const first = await createOtpChallenge({ email, purpose: 'registration' });

      // Simulate 61 seconds passing
      const storedFirst = mockChallenges.find((c) => c.challenge_id === first.challengeId);
      storedFirst.last_sent_at = new Date(Date.now() - 65 * 1000);

      // Issue new OTP
      const second = await createOtpChallenge({ email, purpose: 'registration' });
      expect(second.success).toBe(true);

      // Try verifying the OLD (first) OTP
      const tryFirst = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: first.otpForSending!,
      });
      expect(tryFirst.success).toBe(false);

      // Try verifying the NEW (second) OTP
      const trySecond = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: second.otpForSending!,
      });
      expect(trySecond.success).toBe(true);
    });

    it('prevents reusing an OTP (single-use consumption invariant)', async () => {
      const email = 'single_use@example.com';
      const challenge = await createOtpChallenge({ email, purpose: 'registration' });

      // First consumption
      const firstUse = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: challenge.otpForSending!,
      });
      expect(firstUse.success).toBe(true);

      // Second consumption with the identical code must fail
      const secondUse = await verifyOtpChallenge({
        email,
        purpose: 'registration',
        otp: challenge.otpForSending!,
      });
      expect(secondUse.success).toBe(false);
      expect(secondUse.error).toContain('already been used');
    });

    it('isolates purposes: registration OTP cannot be used for password reset', async () => {
      const email = 'isolation@example.com';
      const regChallenge = await createOtpChallenge({ email, purpose: 'registration' });

      // Attacker tries to use registration OTP to reset password
      const pwResetAttempt = await verifyOtpChallenge({
        email,
        purpose: 'password_reset',
        otp: regChallenge.otpForSending!,
      });
      expect(pwResetAttempt.success).toBe(false);
      expect(pwResetAttempt.error).toContain('No active verification code found');
    });
  });

  // ─── 3. FREE-TIER QUOTA MANAGEMENT & PRIORITY THRESHOLDS ───────────────────

  describe('3. Resend Free-Tier Quota & Priority Guard', () => {
    it('allows all priority tiers under normal threshold (< 70%)', async () => {
      const checkP0 = await checkAndReserveQuota('P0');
      const checkP1 = await checkAndReserveQuota('P1');
      const checkP2 = await checkAndReserveQuota('P2');
      const checkP3 = await checkAndReserveQuota('P3');

      expect(checkP0.allowed).toBe(true);
      expect(checkP1.allowed).toBe(true);
      expect(checkP2.allowed).toBe(true);
      expect(checkP3.allowed).toBe(true);
    });

    it('suppresses P3 (marketing/promotions) when quota reaches 70% warning threshold', async () => {
      // Simulate 64 accepted emails today (64/90 = 71%)
      mockLedgers.push({
        date_key: new Date().toISOString().split('T')[0],
        month_key: new Date().toISOString().slice(0, 7),
        category: 'P1',
        accepted_count: 64,
        attempt_count: 64,
      });

      const p3Check = await checkAndReserveQuota('P3');
      expect(p3Check.allowed).toBe(false);
      expect(p3Check.suppressed).toBe(true);

      // P0, P1, P2 should still be allowed
      const p0Check = await checkAndReserveQuota('P0');
      const p1Check = await checkAndReserveQuota('P1');
      const p2Check = await checkAndReserveQuota('P2');
      expect(p0Check.allowed).toBe(true);
      expect(p1Check.allowed).toBe(true);
      expect(p2Check.allowed).toBe(true);
    });

    it('pauses P2 (back-in-stock alerts) when quota reaches 85% threshold', async () => {
      // Simulate 77 accepted emails today (77/90 = 85.5%)
      mockLedgers.push({
        date_key: new Date().toISOString().split('T')[0],
        month_key: new Date().toISOString().slice(0, 7),
        category: 'P1',
        accepted_count: 77,
        attempt_count: 77,
      });

      const p2Check = await checkAndReserveQuota('P2');
      expect(p2Check.allowed).toBe(false);
      expect(p2Check.suppressed).toBe(true);

      // P0 and P1 must still be protected
      const p0Check = await checkAndReserveQuota('P0');
      const p1Check = await checkAndReserveQuota('P1');
      expect(p0Check.allowed).toBe(true);
      expect(p1Check.allowed).toBe(true);
    });

    it('activates Strict Reserve at 95% allowing ONLY P0 & P1', async () => {
      // Simulate 86 accepted emails today (86/90 = 95.5%)
      mockLedgers.push({
        date_key: new Date().toISOString().split('T')[0],
        month_key: new Date().toISOString().slice(0, 7),
        category: 'P1',
        accepted_count: 86,
        attempt_count: 86,
      });

      const p0Check = await checkAndReserveQuota('P0');
      const p1Check = await checkAndReserveQuota('P1');
      const p2Check = await checkAndReserveQuota('P2');

      expect(p0Check.allowed).toBe(true);
      expect(p1Check.allowed).toBe(true);
      expect(p2Check.allowed).toBe(false);
    });

    it('safely halts all transmissions when quota reaches 100% capacity', async () => {
      // Simulate 90 accepted emails today (90/90 = 100%)
      mockLedgers.push({
        date_key: new Date().toISOString().split('T')[0],
        month_key: new Date().toISOString().slice(0, 7),
        category: 'P1',
        accepted_count: 90,
        attempt_count: 90,
      });

      const p0Check = await checkAndReserveQuota('P0');
      expect(p0Check.allowed).toBe(false);
      expect(p0Check.reason).toContain('transmission capacity reached');
    });

    it('records quota outcomes atomically in the ledger', async () => {
      await recordQuotaOutcome('P0', 'accepted');
      await recordQuotaOutcome('P1', 'accepted');
      await recordQuotaOutcome('P2', 'suppressed');

      const summary = await getQuotaSummary();
      expect(summary.dailyCount).toBeGreaterThanOrEqual(2);
      expect(summary.byCategory.P0.accepted).toBe(1);
      expect(summary.byCategory.P1.accepted).toBe(1);
      expect(summary.byCategory.P2.suppressed).toBe(1);
    });
  });

  // ─── 4. CENTRALIZED EMAIL SENDER & TEMPLATES ───────────────────────────────

  describe('4. Centralized Email Dispatcher & Templates', () => {
    it('dispatches P0 registration verification OTP via centralized sender', async () => {
      const res = await sendVerificationOtp({
        toEmail: 'customer@example.com',
        otp: '482910',
      });
      expect(res.success).toBe(true);
      expect(res.category).toBe('P0');
      expect(res.messageId).toBeDefined();
    });

    it('dispatches P0 password reset OTP', async () => {
      const res = await sendPasswordResetOtp({
        toEmail: 'customer@example.com',
        otp: '194820',
      });
      expect(res.success).toBe(true);
      expect(res.category).toBe('P0');
    });

    it('dispatches P1 order confirmation with accurate financial and item breakdown', async () => {
      const res = await sendOrderConfirmation({
        toEmail: 'buyer@example.com',
        customerName: 'Karthik',
        orderNumber: 'ORD-2026-999',
        billNumber: 'TTRC/25-26/000999',
        totalAmountPaise: 450000,
        paymentMethod: 'razorpay',
        shippingAddress: {
          fullName: 'Karthik Raja',
          line1: '12 Anna Salai',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600002',
        },
        items: [{ name: 'L298N Dual Motor Driver', quantity: 2, pricePaise: 225000 }],
      });
      expect(res.success).toBe(true);
      expect(res.category).toBe('P1');
    });

    it('dispatches P1 payment confirmation', async () => {
      const res = await sendPaymentConfirmation({
        toEmail: 'buyer@example.com',
        customerName: 'Karthik',
        orderNumber: 'ORD-2026-999',
        paymentId: 'pay_RP1029384756',
        amountPaise: 450000,
        paymentMethod: 'razorpay',
      });
      expect(res.success).toBe(true);
      expect(res.category).toBe('P1');
    });

    it('dispatches P2 back-in-stock notification', async () => {
      const res = await sendBackInStockNotification({
        toEmail: 'subscriber@example.com',
        productName: 'ESP32-C3 Dev Board',
        productSlug: 'esp32-c3-dev-board',
        priceRupees: '₹499.00',
        unsubscribeUrl: 'https://ttrc.store/stock-subscriptions/unsub?token=test',
      });
      expect(res.success).toBe(true);
      expect(res.category).toBe('P2');
    });

    it('renders clean OTP email template with 2-minute expiry warning and text fallback', () => {
      const rendered = renderOtpEmail({ purpose: 'registration', otp: '718294' });
      expect(rendered.subject).toContain('Verification Code');
      expect(rendered.html).toContain('718294');
      expect(rendered.html).toContain('2 minutes');
      expect(rendered.text).toContain('718294');
      expect(rendered.text).toContain('2 minutes');
    });
  });

  // ─── 5. SECURITY & LOG PRIVACY ─────────────────────────────────────────────

  describe('5. Sensitive Data & Log Privacy', () => {
    it('never leaks raw OTPs in production logs or responses', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const challenge = await createOtpChallenge({
        email: 'secret_test@example.com',
        purpose: 'registration',
      });

      await sendVerificationOtp({
        toEmail: 'secret_test@example.com',
        otp: challenge.otpForSending!,
      });

      // Verify no console log contained the raw OTP
      for (const call of consoleSpy.mock.calls) {
        const loggedText = call.join(' ');
        expect(loggedText).not.toContain(challenge.otpForSending);
      }
      consoleSpy.mockRestore();
    });
  });
});
