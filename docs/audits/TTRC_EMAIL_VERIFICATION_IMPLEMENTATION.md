# TTRC Store — Secure Email OTP Verification Architecture & Implementation

**Document Reference**: `docs/audits/TTRC_EMAIL_VERIFICATION_IMPLEMENTATION.md`  
**Date**: October 17, 2026  
**Implementation Lead**: Antigravity Autonomous Security Engineer  
**Status**: VERIFIED & DEPLOYED

---

## 1. Overview & Security Objectives

To protect TTRC Store (`ttrc.store`) against fraudulent user registrations, account takeovers, and email spoofing, an authoritative, production-grade 120-second OTP email verification system has been implemented across the customer lifecycle.

### Key Security Invariants Enforced:
1. **Strict 120-Second Server-Side Expiry**: Codes become completely invalid exactly 120 seconds after issuance, regardless of client countdown timers.
2. **Cryptographically Secure Random Generation**: 6-digit numeric OTPs generated via `crypto.randomInt(100000, 1000000)`.
3. **Keyed HMAC-SHA256 Storage**: Plaintext OTPs and hashes are NEVER stored raw. A server-side HMAC secret renders stolen database snapshots useless.
4. **Timing-Safe Constant-Time Verification**: Compares candidate OTPs using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
5. **Atomic Single-Use Consumption**: Uses MongoDB `findOneAndUpdate` atomic operations with multi-condition checks (`is_consumed: false`, `is_invalidated: false`, `expires_at: { $gt: now }`) to completely eliminate concurrent double-consumption race conditions.
6. **Strict Rate Limiting & Cooldown**:
   - 60-second cooldown between resend requests.
   - Maximum 3 verification requests per email per 15-minute rolling window.
   - Maximum 5 incorrect verification attempts per challenge before permanent lockout.
   - IP rate limiting on both request and verification endpoints.
7. **Zero Leakage**: Plaintext OTPs never appear in API responses, URLs, analytics, or production server logs.

---

## 2. Technical Architecture & Database Models

### A. OtpChallengeModel ([models.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/models.ts))

```typescript
export interface IOtpChallenge extends Document {
  challenge_id: string; // Unique opaque UUID exposed to client
  email: string; // Normalized lowercase trimmed email
  purpose: 'registration' | 'password_reset' | 'email_change';
  otp_hash: string; // Keyed HMAC-SHA256 hash
  expires_at: Date; // Issuance + 120 seconds
  attempts: number; // Increment on incorrect attempt (default: 0)
  max_attempts: number; // Strict ceiling (5 attempts)
  is_consumed: boolean; // Set atomically on success (default: false)
  is_invalidated: boolean; // Set true when superseded by newer challenge
  consumed_at?: Date;
  ip_address?: string;
  metadata?: Record<string, any>;
  resend_count: number;
  last_sent_at: Date;
  created_at: Date;
  updated_at: Date;
}
```

- **TTL Index**: `OtpChallengeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 7200 })` provides asynchronous MongoDB background collection cleanup, while application logic strictly enforces 120-second validity.
- **Compound Index**: `OtpChallengeSchema.index({ email: 1, purpose: 1, is_consumed: 1, is_invalidated: 1 })` optimizes high-throughput lookups.

### B. User Schema Updates
The user document now includes:
```typescript
email_verified: { type: Boolean, default: false }
email_verified_at: { type: Date }
```
Existing verified accounts and staff/admin roles (`admin@ttrc.store`) retain verified status automatically, ensuring zero lockout of existing operations.

---

## 3. Account Lifecycle Workflows

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Web as Next.js Web App
    participant Auth as Auth Actions
    participant OTP as OTP Service
    participant Mail as Central Resend Service
    participant DB as MongoDB Atlas

    Note over Customer,DB: 1. Registration Flow
    Customer->>Web: Submits name, email, password, terms
    Web->>Auth: registerAction(formData)
    Auth->>DB: UserModel.create({ ..., email_verified: false })
    Auth->>OTP: createOtpChallenge(email, 'registration')
    OTP->>DB: Stores HMAC hash, 120s expiry, max 5 attempts
    OTP->>Mail: sendVerificationOtp(email, otp)
    Mail-->>Customer: Transactional email with 6-digit code
    Auth-->>Web: Redirects to /verify-email?email=...&challenge=...

    Note over Customer,DB: 2. Verification Flow
    Customer->>Web: Enters 6-digit code
    Web->>Auth: verifyEmailOtpAction(email, otp, challengeId)
    Auth->>OTP: verifyOtpChallenge(email, 'registration', otp)
    OTP->>DB: findOneAndUpdate({ is_consumed: false, expires_at > now, attempts < 5 })
    alt Invalid Code / Attempts < 5
        OTP-->>Web: Rejection with remaining attempts countdown
    else Lockout / Attempts >= 5
        OTP-->>Web: Challenge locked; must request fresh code
    else Valid Code
        OTP->>DB: Marks is_consumed: true, consumed_at: now
        Auth->>DB: UserModel.updateOne({ email_verified: true, email_verified_at: now })
        Auth->>Web: Sets secure HTTP-only session cookie & redirects to /account
    end
```

---

## 4. UI Implementation: `/verify-email`

A dedicated, responsive verification screen has been deployed at [apps/web/src/app/verify-email/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/verify-email/page.tsx):
- **Accessible 6-Digit Grid**: 6 individual numeric boxes with automatic focus advancement, backspace retreat, and full-clipboard paste detection (`inputMode="numeric"`, `pattern="[0-9]*"`).
- **120-Second Ticker**: Visual countdown timer showing remaining seconds, alerting users to strict expiry.
- **Cooldown-Gated Resend Button**: Displays live countdown (`Resend in 48s`) and stays disabled until 60-second cooldown expires.
- **Brand Compliance**: Adheres to the White + Red platform aesthetic (`#FFFFFF` background, `#E3132A` primary action, `#14141A` typography, subtle red `#FDECEE` badges).
- **Suspense Boundary**: Wrapped in `<React.Suspense>` for safe server rendering and static page compilation.

---

## 5. Security & Attack Defenses

| Attack Vector | Defense Implemented |
|---|---|
| **Brute Force OTP Guessing** | Capped at 5 attempts per code; IP rate limited to 20 attempts per 10 minutes. |
| **Email Bombing / Spamming** | 60-second cooldown between resends; maximum 3 codes per email per 15 minutes; IP rate limited to 10 requests per 10 minutes. |
| **Race Condition / Double Consumption** | Atomic MongoDB `findOneAndUpdate` condition requiring `is_consumed: false`. If two concurrent requests arrive simultaneously, exactly one succeeds; the second receives `already consumed`. |
| **Purpose Substitution** | Registration OTPs cannot reset passwords; password-reset OTPs cannot change profile emails. Purpose is strictly bound in challenge documents. |
| **Account Enumeration** | Public password-reset requests return identical success responses whether the email exists or not. |
| **Log Leakage** | Subject lines and email dispatcher console outputs do not log the plaintext OTP or HMAC hashes. |
