# TTRC Store — Security Remediation Report (Phase 2 & Hardening)
**Platform:** TTRC Store (`ttrc.store` / `ttrc.shop`)  
**Scope:** Remediation of All Critical, High, and Governance Vulnerabilities  
**Date of Completion:** October 17, 2026  
**Status:** All 7 Security Vulnerabilities Remediated & Independently Verified with Automated Test Suites

---

## 1. Executive Summary

In response to the Phase 1 Security Discovery audit and independent security reviews, all critical and high-priority vulnerabilities were remediated and verified across the TTRC Store codebase:
1. **SEC-01 (CRITICAL):** Removed hardcoded MongoDB credentials and replica seedlists from `apps/web/src/lib/mongodb/client.ts`. Mandatory server-authoritative `MONGODB_URI` environment configuration enforced.
2. **SEC-02 (CRITICAL):** Completely excised the hardcoded admin login fallback backdoor and password hash overwrite logic from `apps/web/src/actions/auth.ts`.
3. **SEC-03 (HIGH):** Closed the invoice BOLA/IDOR vulnerability in `apps/web/src/app/api/invoice/[id]/route.ts`. Removed `isRecentOrder` bypass, implemented high-entropy cryptographically secure guest tokens with timing-safe SHA-256 validation, verified full response body/headers (zero customer PII in errors, identical 404 for nonexistent vs unauthorized orders), enforced guest token revocation on cancelled/refunded orders, and applied strict `private, no-store` cache headers across all paths.
4. **SEC-04 (HIGH):** Removed predictable default administrator password (`Admin@ttrc2026`) from `apps/web/src/lib/mongodb/seed.ts`. Initial administrator provisioning is strictly gated behind `INITIAL_ADMIN_PASSWORD` with enforced complexity (>= 12 characters, uppercase, lowercase, number, symbol, and weak password blacklist), guaranteed zero password logging, and server-only storage.
5. **SEC-05 (HIGH):** Implemented multi-device session revocation via `token_version` on the User model and JWT session cookie. Any password change, password reset, or administrative customer deactivation atomically increments `token_version`, instantly invalidating active sessions across all devices.
6. **SEC-06 (HIGH):** Implemented sensitive administrative operations reauthentication (`requireAdminReauth`) with a 15-minute sliding window or inline password challenge. Enforced on sensitive store settings (`gst_enabled`, `razorpay_enabled`, `cod_max_limit_paise`), terminal order states (`refunded`, `cancelled`), product deletions, and customer deactivations. Rate-limited password verification protects against brute-force attacks.
7. **SEC-07 (MEDIUM):** Eliminated the fallback `rzp_test_...` key from `apps/web/src/app/payment-test/page.tsx`. Reads exclusively from `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`. Middleware blocks `/payment-test` in production.

---

## 2. Detailed Remediation Breakdown

### Finding SEC-01: Remove Hardcoded MongoDB Credentials (CRITICAL)
* **Root Cause:** Plaintext username and password for user `ttrcstoree_db_user` were hardcoded in `client.ts` to aid local Windows SRV DNS resolution.
* **Files Changed:** `apps/web/src/lib/mongodb/client.ts`
* **Fix Implemented:**
  - Removed `DIRECT_REPLICA_SEEDLIST` containing credentials.
  - Added `assertMongoUri(MONGODB_URI)` to ensure initialization fails safely with a clear configuration message if `MONGODB_URI` is missing or malformed.
  - Sanitized error logs so that connection strings and credentials are never printed or leaked.
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-01 test cases)
  - `node scripts/securityAudit.mjs` (SEC-01 assertion)
* **Remaining Operator Action:**
  - Operator must rotate the database user's password in MongoDB Atlas Console and update `MONGODB_URI` in Vercel project environment variables (documented in `TTRC_SECRET_ROTATION_RUNBOOK.md`).

---

### Finding SEC-02: Remove Admin Login Backdoor (CRITICAL)
* **Root Cause:** A fallback condition in `loginAction` allowed logging in as `admin@ttrc.store` using fallback strings (`TTRC@store` and `Admin@ttrc2026`), overwriting the database password hash with a newly computed hash.
* **Files Changed:** `apps/web/src/actions/auth.ts`
* **Fix Implemented:**
  - Completely deleted the fallback comparison and database hash overwrite block.
  - Authentication now strictly compares candidate passwords against `user.password_hash` using `bcrypt.compare`.
  - Failed logins return generic error `{ error: 'Invalid email or password.' }` and never mutate account fields, privileges, or verification flags.
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-02 test cases)
  - Static audit in `scripts/securityAudit.mjs`.

---

### Finding SEC-03: Fix Invoice BOLA/IDOR & Response Invariance (HIGH)
* **Root Cause:** A 24-hour timestamp check (`isRecentOrder`) allowed unauthenticated requests with guessed sequential order numbers or ObjectIds to view full customer invoices with PII.
* **Files Changed:**
  - `apps/web/src/app/api/invoice/[id]/route.ts`
  - `apps/web/src/actions/checkout.ts`
  - `apps/web/src/lib/mongodb/models.ts`
* **Fix Implemented:**
  - Removed `isRecentOrder` unauthenticated bypass completely.
  - Enforced strict session authorization: only the authenticated order owner (`order.user_id === auth.user.id`) or store administrator/staff can view invoices without a token.
  - For guest orders, a 32-byte cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`) is generated at checkout. Its SHA-256 hash is persisted in `order.guest_invoice_token_hash`.
  - Guest invoice access requires passing `?token=...`. Candidate tokens are verified using `crypto.timingSafeEqual` against the stored hash in constant time.
  - **Full Response Body & Header Validation**: Unauthenticated and unauthorized requests return the exact same 404 `{ error: 'Invoice not found or access denied.' }` with zero customer PII (no name, phone, address, total, or HTML markup).
  - **Equivalence Between Nonexistent and Unauthorized Orders**: Both paths trigger the identical `denyResponse()` helper, preventing database probing and order number enumeration.
  - **Token Revocation**: If an order is cancelled or refunded, or if guest access has been explicitly revoked (`guest_invoice_token_revoked: true`), guest token access is immediately blocked.
  - **Anti-Caching Directives**: All responses (success and error) include `Cache-Control: private, no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, and `X-Content-Type-Options: nosniff`.
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-03 test cases)
  - Detailed test evidence in `docs/security/TTRC_INVOICE_ACCESS_TEST_REPORT.md`.

---

### Finding SEC-04: Remove Predictable Seeder Password & Enforce Complexity (HIGH)
* **Root Cause:** `ensureDatabaseSeeded()` created a default admin user with a static password hash (`Admin@ttrc2026`) if no admin existed.
* **Files Changed:** `apps/web/src/lib/mongodb/seed.ts`
* **Fix Implemented:**
  - Removed static password string and hash generation.
  - Enforced strict complexity for `INITIAL_ADMIN_PASSWORD`: minimum 12 characters, requiring uppercase, lowercase, digit, and symbol.
  - Rejection of blacklisted weak patterns (e.g. `admin@ttrc2026`, `admin123`, `password123`, `changeme123`, `ttrc@store`).
  - Zero password logging: neither the plaintext password nor the hash is ever logged to stdout or stderr.
  - Guarded with `adminCount === 0` so reseeding never overwrites existing administrators.
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-04 test cases)
  - `scripts/securityAudit.mjs`.

---

### Finding SEC-05: Multi-Device Session Revocation via `token_version` (HIGH)
* **Root Cause:** JWT session cookies were stateless and valid for 7 days without a server-side revocation mechanism, allowing stolen or stale session tokens to persist after password changes or account suspension.
* **Files Changed:**
  - `apps/web/src/lib/mongodb/models.ts`
  - `apps/web/src/lib/auth-helpers.ts`
  - `apps/web/src/actions/auth.ts`
  - `apps/web/src/actions/admin.ts`
* **Fix Implemented:**
  - Added `token_version: { type: Number, default: 1 }` to the User schema and interface.
  - Embedded `tokenVersion` into the signed session JWT payload during login/registration.
  - `getAuthenticatedUser()` strictly verifies that the token's `tokenVersion` matches the live database `user.token_version`. If mismatched, authentication fails with `401 Session Revoked`.
  - Password changes (`changePasswordAction`), password resets (`resetPasswordAction`), and administrative account deactivations (`disableCustomerAction`) atomically execute `$inc: { token_version: 1 }`, instantly terminating all active sessions across all devices.
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-05 test cases)
  - `scripts/securityAudit.mjs`.

---

### Finding SEC-06: Sensitive Admin Operations Reauthentication (HIGH)
* **Root Cause:** High-impact administrative actions (refunds, order cancellations, product deletions, and payment settings changes) lacked step-up authentication, leaving them vulnerable to session hijacking or unattended console tampering.
* **Files Changed:**
  - `apps/web/src/lib/auth-helpers.ts`
  - `apps/web/src/actions/admin-reauth.ts` (new)
  - `apps/web/src/actions/settings.ts`
  - `apps/web/src/actions/admin.ts`
* **Fix Implemented:**
  - Implemented `requireAdminReauth(inlinePassword?)`: checks for a valid 15-minute sliding window signed cookie (`ttrc_admin_reauth`) or validates an inline password against the admin's database hash.
  - Created `confirmAdminPasswordAction` with strict brute-force rate-limiting (5 attempts per 10 minutes) and audit logging.
  - Protected operations:
    - Sensitive site settings (`gst_enabled`, `razorpay_enabled`, `cod_max_limit_paise`).
    - Terminal order states (`refunded`, `cancelled`).
    - Permanent product deletion (`deleteProductAction`).
    - Customer deactivation (`disableCustomerAction`).
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-06 test cases)
  - `tests/security/admin-panel-production-hardening.test.ts`
  - `scripts/securityAudit.mjs`.

---

### Finding SEC-07: Remove Razorpay Test-Key Fallback (MEDIUM)
* **Root Cause:** `payment-test/page.tsx` contained `'rzp_test_TnRvg3LwstLPha'` as an inline default fallback.
* **Files Changed:** `apps/web/src/app/payment-test/page.tsx`
* **Fix Implemented:**
  - Removed the fallback string. The page now reads strictly from `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`.
  - Maintained Edge Middleware block preventing access to `/payment-test` when `NODE_ENV === 'production'`.
* **Verification Test:**
  - `apps/web/tests/security/remediation-phase2.test.ts` (SEC-07 test cases)
  - `scripts/securityAudit.mjs`.

---

## 3. Test Execution & Verification Summary

| Test Suite | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Remediation Phase 2 Regression Tests** (`remediation-phase2.test.ts`) | 30 | 30 | 0 | **PASS (100%)** |
| **Comprehensive Security Audit** (`scripts/securityAudit.mjs`) | 43 | 43 | 0 | **PASS (100%)** |
| **Full Unit & Integration Test Suite** (`pnpm test`) | 223 | 223 | 0 | **PASS (100%)** |
| **TypeScript Typecheck** (`pnpm typecheck`) | 3 packages | 3 | 0 | **PASS (0 errors)** |
| **Turbopack Production Build** (`pnpm build`) | 56 routes | 56 | 0 | **PASS** |

---

## 4. Current Status: CONDITIONAL

Codebase remediations are 100% complete and verified. Release gate remains at **CONDITIONAL** until the operator creates the replacement least-privilege MongoDB Atlas user and updates Vercel environment variables as specified in `TTRC_SECRET_ROTATION_RUNBOOK.md`.
