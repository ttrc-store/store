/**
 * Secure OTP Verification Engine for TTRC Store
 * Enforces:
 * - 6 numeric digits (cryptographically secure via crypto.randomInt)
 * - Strict 120-second (2-minute) server-side expiry
 * - Keyed HMAC-SHA256 storage (never plaintext OTP in database or logs)
 * - Timing-safe constant-time comparison
 * - Max 5 attempts before challenge lockout
 * - 60-second resend cooldown
 * - Max 3 resends per 15-minute rolling window per email
 * - Atomic consumption (protects against concurrent race conditions)
 * - Invalidation of prior active challenges
 */

import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OtpChallengeModel, IOtpChallenge } from '@/lib/mongodb/models';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export type OtpPurpose = 'registration' | 'password_reset' | 'email_change';

export interface CreateChallengeResult {
  success: boolean;
  challengeId?: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
  error?: string;
  otpForSending?: string; // Strictly internal to the server dispatcher; NEVER returned in public API responses
}

export interface VerifyChallengeResult {
  success: boolean;
  email?: string;
  purpose?: OtpPurpose;
  error?: string;
  locked?: boolean;
  expired?: boolean;
  metadata?: Record<string, any>;
}

function getOtpSecret(): string {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OTP_SECRET or JWT_SECRET is missing in production');
    }
    return 'ttrc_store_otp_hmac_secret_key_2026';
  }
  return secret;
}

/**
 * Normalizes email address (lowercase and trimmed)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Computes keyed HMAC-SHA256 of the OTP
 */
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', getOtpSecret()).update(otp.trim()).digest('hex');
}

/**
 * Constant-time comparison to prevent timing side-channel attacks
 */
export function verifyOtpHash(candidateOtp: string, expectedHash: string): boolean {
  const candidateHash = hashOtp(candidateOtp);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  // Generates between 100000 and 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Request / Issue a new OTP challenge
 */
export async function createOtpChallenge(params: {
  email: string;
  purpose: OtpPurpose;
  ipAddress?: string;
  metadata?: Record<string, any>;
}): Promise<CreateChallengeResult> {
  const email = normalizeEmail(params.email);
  const { purpose, ipAddress, metadata } = params;

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  // 1. IP Rate Limiting (10 requests per 10 minutes)
  if (ipAddress) {
    const ipLimit = await checkRateLimit({
      key: `otp:req:ip:${ipAddress}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return { success: false, error: 'Too many requests from your network. Please wait a few minutes.' };
    }
  }

  // 2. Email Rate Limiting: 3 resends per 15-minute rolling window
  const windowLimit = await checkRateLimit({
    key: `otp:resend_window:${email}:${purpose}`,
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!windowLimit.success) {
    return {
      success: false,
      error: 'Maximum verification attempts reached (3 requests per 15 minutes). Please try again later.',
    };
  }

  await connectToDatabase();

  // 3. Resend Cooldown Check: 60 seconds
  const lastActiveChallenge = await OtpChallengeModel.findOne({
    email,
    purpose,
    is_consumed: false,
    is_invalidated: false,
  }).sort({ created_at: -1 });

  if (lastActiveChallenge) {
    const elapsedMs = Date.now() - new Date(lastActiveChallenge.last_sent_at).getTime();
    const cooldownMs = 60 * 1000;
    if (elapsedMs < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      return {
        success: false,
        cooldownSeconds: remainingSeconds,
        error: `Please wait ${remainingSeconds} seconds before requesting another verification code.`,
      };
    }
  }

  // 4. Invalidate any prior active challenges for this email + purpose
  await OtpChallengeModel.updateMany(
    {
      email,
      purpose,
      is_consumed: false,
      is_invalidated: false,
    },
    {
      $set: { is_invalidated: true },
    }
  );

  // 5. Generate secure 6-digit OTP and calculate HMAC hash
  const otp = generateNumericOtp();
  const otp_hash = hashOtp(otp);
  const challenge_id = crypto.randomUUID();
  const ttlSeconds = 120; // Exactly 120 seconds
  const expires_at = new Date(Date.now() + ttlSeconds * 1000);

  const resendCount = lastActiveChallenge ? (lastActiveChallenge.resend_count || 0) + 1 : 0;

  // 6. Persist challenge in MongoDB
  await OtpChallengeModel.create({
    challenge_id,
    email,
    purpose,
    otp_hash,
    expires_at,
    attempts: 0,
    max_attempts: 5,
    is_consumed: false,
    is_invalidated: false,
    ip_address: ipAddress,
    metadata,
    resend_count: resendCount,
    last_sent_at: new Date(),
  });

  return {
    success: true,
    challengeId: challenge_id,
    expiresInSeconds: ttlSeconds,
    cooldownSeconds: 60,
    otpForSending: otp,
  };
}

/**
 * Authoritatively verifies an OTP against an issued challenge.
 * Uses atomic updates to guarantee single consumption and prevent race conditions.
 */
export async function verifyOtpChallenge(params: {
  email: string;
  purpose: OtpPurpose;
  otp: string;
  challengeId?: string;
  ipAddress?: string;
}): Promise<VerifyChallengeResult> {
  const email = normalizeEmail(params.email);
  const { purpose, otp, challengeId, ipAddress } = params;

  // Format validation
  const cleanOtp = (otp || '').trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { success: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  // IP Brute-Force Rate Limiter (20 verification attempts per 10 minutes)
  if (ipAddress) {
    const ipLimit = await checkRateLimit({
      key: `otp:verify:ip:${ipAddress}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return { success: false, error: 'Too many incorrect attempts. Please wait a few minutes.' };
    }
  }

  await connectToDatabase();
  const now = new Date();

  // Find the target challenge
  const query: any = {
    email,
    purpose,
    is_consumed: false,
    is_invalidated: false,
  };
  if (challengeId) {
    query.challenge_id = challengeId;
  }

  const challenge = await OtpChallengeModel.findOne(query).sort({ created_at: -1 });

  if (!challenge) {
    return {
      success: false,
      error: 'No active verification code found or code has already been used. Please request a new code.',
    };
  }

  // Check lockout
  if (challenge.attempts >= challenge.max_attempts) {
    return {
      success: false,
      locked: true,
      error: 'This verification code is locked due to too many failed attempts. Please request a new code.',
    };
  }

  // Strict Expiry check: 120 seconds
  if (challenge.expires_at <= now) {
    return {
      success: false,
      expired: true,
      error: 'Verification code has expired. Codes are valid for 2 minutes. Please request a new code.',
    };
  }

  // Verify HMAC hash using timing-safe comparison
  const isValid = verifyOtpHash(cleanOtp, challenge.otp_hash);

  if (!isValid) {
    // Atomically increment attempts
    const updated = await OtpChallengeModel.findOneAndUpdate(
      {
        _id: challenge._id,
        is_consumed: false,
        attempts: { $lt: challenge.max_attempts },
      },
      {
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    const attemptsRemaining = updated
      ? Math.max(0, updated.max_attempts - updated.attempts)
      : 0;

    if (attemptsRemaining === 0) {
      return {
        success: false,
        locked: true,
        error: 'Too many incorrect attempts. This code is now invalidated. Please request a new code.',
      };
    }

    return {
      success: false,
      error: `Invalid verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Atomically consume the challenge (guarantees exactly one consumer in concurrent requests)
  const consumed = await OtpChallengeModel.findOneAndUpdate(
    {
      _id: challenge._id,
      is_consumed: false,
      is_invalidated: false,
      expires_at: { $gt: now },
      attempts: { $lt: challenge.max_attempts },
    },
    {
      $set: {
        is_consumed: true,
        consumed_at: new Date(),
      },
    },
    { new: true }
  );

  if (!consumed) {
    return {
      success: false,
      error: 'This verification code was already consumed or expired in another request.',
    };
  }

  return {
    success: true,
    email: consumed.email,
    purpose: consumed.purpose,
    metadata: consumed.metadata,
  };
}
