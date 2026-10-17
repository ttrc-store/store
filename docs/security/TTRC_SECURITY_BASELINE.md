# TTRC Store — Comprehensive Security Baseline & Discovery Audit
**Platform:** TTRC Store (`ttrc.store` / `ttrc.shop`)  
**Company:** Tamizh Tech, Coimbatore, Tamil Nadu  
**Technology Stack:** Next.js (App Router, React Server Components) + TypeScript + MongoDB Atlas + Razorpay + Resend  
**Date of Audit:** October 17, 2026  
**Auditor:** Application Security & Cloud Security Architecture  
**Audit Scope:** Full repository source code, route handlers, server actions, authentication/authorization layers, payment gateways, database client, uploads, and deployment configurations.

---

## 1. Executive Summary

This Security Baseline document establishes the current defensive posture of TTRC Store prior to any code changes under the Zero-Trust Security Hardening mandate. 

Our in-depth automated and manual review of all 14 API endpoints, 35+ Server Actions, Edge Middleware, database models, payment verification handlers, and authentication mechanisms revealed a foundation with several strong security primitives already implemented (Edge Web Crypto HMAC verification, atomic stock updates with `$gte`, timing-safe Razorpay signature validation, and magic-byte media upload validation). 

However, the audit identified **two CRITICAL vulnerabilities** (hardcoded database credentials in connection source code and a hardcoded administrator password backdoor), **one HIGH-severity BOLA/IDOR vulnerability** (unauthenticated invoice PII exposure for recent orders), and several **Medium-severity configuration risks**.

Under the Zero-Trust principle, these vulnerabilities must be remediated in prioritized phases, tested in staging, and confirmed without disrupting active customers, orders, or legitimate transactions.

---

## 2. Findings Severity Classification Matrix

| Finding ID | Title | Severity | Affected Component | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Hardcoded MongoDB Atlas Database Credentials in Client Code | **CRITICAL** | `apps/web/src/lib/mongodb/client.ts` | **OPEN (Requires Rotation & Code Removal)** |
| **SEC-02** | Hardcoded Admin Password Backdoor / Override in Login Action | **CRITICAL** | `apps/web/src/actions/auth.ts` | **OPEN (Pending Phase 3 Removal)** |
| **SEC-03** | BOLA / IDOR Invoice PII Exposure via Recent Order Window | **HIGH** | `apps/web/src/app/api/invoice/[id]/route.ts` | **OPEN (Pending Phase 4/7 Fix)** |
| **SEC-04** | Predictable Default Admin Password in Database Seeder | **HIGH** | `apps/web/src/lib/mongodb/seed.ts` | **OPEN (Pending Phase 3/6 Fix)** |
| **SEC-05** | Stateless JWT Tokens Lack Database Token Version Invalidation | **MEDIUM** | `apps/web/src/lib/jwt.ts`, `apps/web/src/lib/auth-helpers.ts` | **OPEN (Pending Phase 3/4 Fix)** |
| **SEC-06** | Lack of Multi-Factor Authentication (MFA) & Reauthentication for Admin Actions | **MEDIUM** | `apps/web/src/actions/admin.ts`, `apps/web/src/actions/orders.ts` | **OPEN (Pending Phase 3 Implementation)** |
| **SEC-07** | Hardcoded Razorpay Test Key Fallback in Payment Test Client Page | **MEDIUM** | `apps/web/src/app/payment-test/page.tsx` | **OPEN (Pending Phase 5 Fix)** |
| **SEC-08** | In-Memory / Single-Collection Audit Trail Vulnerable to Direct DB Admin Tampering | **LOW** | `apps/web/src/lib/mongodb/models.ts` | **OPEN (Pending Phase 9 Hardening)** |
| **SEC-09** | Broad CSP `img-src` Wildcard for Remote Images | **LOW** | `apps/web/next.config.ts` | **OPEN (Pending Phase 2 Tightening)** |
| **SEC-10** | Missing IP Allowlist / Vercel Secure Compute for Atlas Connection | **INFORMATIONAL** | Network & Cloud Architecture | **OPEN (Requires Paid Plan Evaluation)** |

---

## 3. Deep-Dive Vulnerability Analysis & Evidence

### SEC-01 [CRITICAL]: Hardcoded MongoDB Atlas Credentials in Source Code
* **Affected File:** `apps/web/src/lib/mongodb/client.ts` (Lines 19–20)
* **Evidence:**
  ```ts
  const DIRECT_REPLICA_SEEDLIST =
    'mongodb://ttrcstoree_db_user:[REDACTED_SECRET]@ac-d2d3mt6-shard-00-00.imdmatw.mongodb.net:27017...';
  const MONGODB_URI = process.env.MONGODB_URI || DIRECT_REPLICA_SEEDLIST;
  const DIRECT_FALLBACK_URI = process.env.MONGODB_DIRECT_URI || DIRECT_REPLICA_SEEDLIST;
  ```
* **Impact:** 
  Any individual with read access to the repository, CI build logs, or deployment bundles could extract full read/write database credentials for the production MongoDB cluster `imdmatw.mongodb.net`. Because MongoDB Atlas network rules often allow `0.0.0.0/0` for Vercel serverless functions, this credential allows direct unauthorized access to customer PII, order records, and settings.
* **Remediation Plan:**
  1. Immediately rotate the MongoDB Atlas password for user `ttrcstoree_db_user` in the Atlas Console.
  2. Set `MONGODB_URI` securely in Vercel project environment variables.
  3. Remove `DIRECT_REPLICA_SEEDLIST` containing credentials from `apps/web/src/lib/mongodb/client.ts`. Enforce that the application halts with a clean configuration error if `MONGODB_URI` is missing.
* **Verification Test:** Automated regex scan in `scripts/securityAudit.mjs` verifying zero connection string strings or credentials exist in source.

---

### SEC-02 [CRITICAL]: Hardcoded Admin Password Backdoor in Login Action
* **Affected File:** `apps/web/src/actions/auth.ts` (Lines 90–94)
* **Evidence:**
  ```ts
  if (!isMatch && user.email === 'admin@ttrc.store' && (password === 'TTRC@store' || password === 'Admin@ttrc2026')) {
    isMatch = true;
    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();
  }
  ```
* **Impact:**
  Anyone entering the hardcoded fallback passwords can immediately gain full store administrator access, bypassing the real administrator's hashed password and even overwriting the password hash in the database.
* **Remediation Plan:**
  1. Remove this fallback block completely. All authentication must verify strictly against the bcrypt hash in `user.password_hash`.
  2. Implement proper password reset via verified email OTP for legitimate recovery.
* **Verification Test:** Unit test attempting login with previous fallback credentials asserting authentication rejection (`status: 401`).

---

### SEC-03 [HIGH]: BOLA / IDOR Invoice PII Exposure via Recent Order Window
* **Affected File:** `apps/web/src/app/api/invoice/[id]/route.ts` (Lines 42–51)
* **Evidence:**
  ```ts
  const orderAgeMs = Date.now() - new Date(order.created_at || Date.now()).getTime();
  const isRecentOrder = orderAgeMs < 24 * 60 * 60 * 1000;

  if (!isAuthenticated && !isGuestMatch && !isRecentOrder) {
    return NextResponse.json({ error: 'Authentication required to view invoice' }, { status: 401 });
  }

  if (!isOwner && !isAdmin && !isGuestMatch && !isRecentOrder) {
    return NextResponse.json({ error: 'Forbidden: You are not authorized to view this invoice' }, { status: 403 });
  }
  ```
* **Impact:**
  Because order numbers are sequential or predictable (e.g., `TTRC-ORD-2026-00001`), any unauthenticated third party can query `/api/invoice/TTRC-ORD-2026-00001` within 24 hours of placement and download the customer's full invoice containing their full name, phone number, shipping address, and financial breakdown.
* **Remediation Plan:**
  1. Eliminate the `isRecentOrder` unauthenticated bypass.
  2. Access must require either:
     - Active session with `auth.user.id === order.user_id` or `auth.user.role === 'admin'`, OR
     - Cryptographic invoice access token generated at order time (e.g., `invoice_token = crypto.randomBytes(24).toString('hex')`) passed as a query parameter for guest checkout confirmation links.
* **Verification Test:** Integration test verifying that unauthenticated requests to `/api/invoice/:orderNumber` without a valid guest access token are rejected with HTTP 401/403.

---

### SEC-04 [HIGH]: Predictable Default Admin Password in Database Seeder
* **Affected File:** `apps/web/src/lib/mongodb/seed.ts` (Line 58)
* **Evidence:**
  ```ts
  const defaultPasswordHash = await bcrypt.hash('Admin@ttrc2026', 10);
  ```
* **Impact:**
  If an environment is seeded and the administrator does not immediately rotate credentials, any attacker knowing the public repository default can log in as `admin@ttrc.store`.
* **Remediation Plan:**
  1. Ensure seed script only seeds an admin account if `INITIAL_ADMIN_PASSWORD` is supplied via environment variables, or generates a secure random 24-character secret logged to secure stdout once.
  2. Require an immediate password change flag (`must_change_password: true`) upon initial login.
* **Verification Test:** Database seeder unit test checking random generation or env var requirement.

---

### SEC-05 [MEDIUM]: Stateless JWT Tokens Lack Database Token Version Invalidation
* **Affected Files:** `apps/web/src/lib/jwt.ts`, `apps/web/src/lib/auth-helpers.ts`
* **Evidence:**
  JWT tokens are signed with `JWT_SECRET` and contain `{ id, email, role, exp }`. There is no `token_version` check against the database user record.
* **Impact:**
  If a user's password is changed or an admin account is suspected of compromise, existing active session tokens remain valid until their 7-day expiration (`maxAge: 7 * 24 * 60 * 60`).
* **Remediation Plan:**
  1. Add `token_version: number` to `UserModel`.
  2. Include `token_version` in the JWT payload.
  3. Increment `token_version` on password changes, email changes, or explicit admin revocation to immediately invalidate all existing sessions.
* **Verification Test:** Revocation test ensuring token with old `token_version` is rejected upon server validation.

---

### SEC-06 [MEDIUM]: Lack of Multi-Factor Authentication (MFA) & Reauthentication
* **Affected Files:** `apps/web/src/actions/admin.ts`, `apps/web/src/actions/orders.ts`
* **Evidence:**
  Admin actions (e.g. issuing customer refunds, editing products, creating coupons, updating site settings) only check `requireAdmin()` based on session cookie.
* **Impact:**
  If an administrator leaves their browser unattended or suffers session hijacking, the attacker can execute irreversible financial actions (refunds, order cancellation) without reauthentication.
* **Remediation Plan:**
  1. Implement TOTP-based Multi-Factor Authentication (MFA) for administrative accounts.
  2. Implement reauthentication challenge (`requireAdminReauth()`) for high-risk actions (refunds, status changes, settings alterations) requiring the administrator to enter their current password or OTP within a 15-minute sliding window.
* **Verification Test:** Server action test verifying that refund execution fails without an active reauth timestamp.

---

### SEC-07 [MEDIUM]: Hardcoded Razorpay Test Key Fallback in Client Component
* **Affected File:** `apps/web/src/app/payment-test/page.tsx` (Line 54)
* **Evidence:**
  ```tsx
  <p><span className="font-bold">Key ID:</span> {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TnRvg3LwstLPha'}</p>
  ```
* **Impact:**
  While middleware blocks `/payment-test` in production (`process.env.NODE_ENV === 'production'`), committing test keys into client bundles violates secret cleanliness and could be bundled if environment flags are misconfigured.
* **Remediation Plan:**
  Remove the hardcoded fallback; read exclusively from `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`.
* **Verification Test:** Static code scan in `scripts/securityAudit.mjs` verifying zero `rzp_test_` occurrences.

---

## 4. Current Defenses Confirmed Working (Baseline Strengths)

During Phase 1 discovery, the following security layers were confirmed to be properly implemented and effective:

1. **Edge Cryptographic JWT Verification:**  
   `apps/web/src/middleware.ts` uses Web Crypto API (`crypto.subtle.verify`) with HMAC-SHA256 to cryptographically validate session cookies at the edge before requests reach server actions or route handlers.
2. **Server-Authoritative Pricing & Checkout Invariants:**  
   `apps/web/src/actions/checkout.ts` recomputes all item prices, GST rates, shipping thresholds, and discounts exclusively from database records. Client-provided prices are ignored.
3. **Atomic Stock Updates & Overselling Protection:**  
   Inventory deduction uses MongoDB atomic conditional operations:
   `ProductModel.findOneAndUpdate({ _id: item.id, stock_quantity: { $gte: item.quantity } }, { $inc: { stock_quantity: -item.quantity } })`
   with full compensation rollback if any item in a multi-item cart fails.
4. **Timing-Safe Razorpay Webhook Signature Verification:**  
   `apps/web/src/app/api/webhooks/razorpay/route.ts` verifies incoming webhook signatures using `crypto.timingSafeEqual` and validates the raw request body buffer.
5. **Webhook Idempotency & Financial Reconciliation:**  
   `apps/web/src/app/api/webhooks/razorpay/route.ts` records `event_id` in `AuditLogModel` and rejects duplicate events. It strictly validates that `paymentEntity.amount === order.total`.
6. **File Upload Magic Byte Inspection & Safe WebP Pipeline:**  
   `apps/web/src/app/api/admin/media/upload/route.ts` checks binary headers (`0xff 0xd8` for JPEG, `0x89 0x50` for PNG, `RIFF...WEBP`), sanitizes SVGs against XSS/XXE, and converts files into safe lossless WebP using Sharp before saving.
7. **HTTP Security Headers:**  
   `apps/web/next.config.ts` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS with `max-age=63072000; includeSubDomains; preload`, and `Content-Security-Policy`.

---

## 5. Prioritized Remediation Roadmap

1. **Phase 1 (Complete):** Baseline documentation, threat modeling, and attack surface inventory.
2. **Phase 2 (Edge & Network):** Security headers refinement, search/catalog rate limiting, request size limits, and canonical domain handling.
3. **Phase 3 (Admin Hardening):** Eliminate hardcoded credentials & backdoors (SEC-01, SEC-02, SEC-04), implement admin MFA/reauthentication (SEC-06), and add token revocation (SEC-05).
4. **Phase 4 (Customer Account Security):** Fix invoice BOLA/IDOR (SEC-03) with cryptographically random access tokens, harden OTP flows, and prevent account enumeration.
5. **Phase 5 (Razorpay Payment Security):** Remove test key fallbacks (SEC-07), audit refund flows, and add payment reconciliation runbooks.
6. **Phase 6 (MongoDB Atlas Hardening):** Strict least-privilege DB users, index validation, and automated backup/restore verification.
7. **Phase 7 (API & Upload Security):** Universal input validation with Zod, sanitize error messages, and ensure private documents require signed authorization.
8. **Phase 8 (Secrets & Supply Chain):** Secret scanning, lockfile audit, CI integration.
9. **Phase 9 (Monitoring & Incident Response):** Centralized security audit logs and runbooks.
10. **Phase 10 (Security Testing & Verification):** Comprehensive regression test suite.
11. **Phase 11 (Release Gates):** Final validation report and production release approval.
