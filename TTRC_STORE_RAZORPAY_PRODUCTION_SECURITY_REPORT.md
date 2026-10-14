# TTRC Store — Razorpay Production Payment Security Audit and Remediation Report

**Target Domain:** `https://ttrc.store/` (Secondary: `https://ttrc.shop/`)  
**Architecture:** Next.js 16.3.6 (App Router), TypeScript Strict Mode, MongoDB Atlas, Turborepo  
**Audit Date:** October 13, 2026  
**Auditor:** Senior Application Security & Fintech Systems Auditor (DeepMind Antigravity)  
**Overall Readiness Verdict:** **FIXED & SECURED — CONDITIONAL GO (Test Mode Validated; Awaiting Live Production Keys)**

---

## 1. Executive Summary

A comprehensive payment-security audit was conducted on the Razorpay Standard Web Checkout integration across the TTRC Store codebase. The objective was to guarantee that **no client-side price or order manipulation is possible**, every order is marked paid **only after authoritative, server-verified payment capture**, customer isolation is strictly maintained, and development test routes are barred in production.

All identified vulnerabilities have been remediated, verified with adversarial automated test suites, typechecked with zero errors, and validated in an optimized production Next.js build.

---

## 2. Security Check Matrix

| Check # | Security Requirement | Status | Summary of Remediation |
| :--- | :--- | :---: | :--- |
| **SEC-01** | Server-Authoritative Order Creation | **FIXED & VERIFIED** | Removed client-supplied amount; `/api/create-order` now derives amount strictly from MongoDB `order.total`. Enforces customer session ownership and reuses Razorpay orders idempotently. |
| **SEC-02** | Cryptographic & Status Payment Verification | **FIXED & VERIFIED** | `/api/verify-payment` verifies HMAC-SHA256 signature using timing-safe buffer comparison (`timingSafeEqual`), checks customer ownership, and fetches payment status directly from Razorpay API (`payments.fetch`) to confirm status is `'captured'` and matches `order.total` exactly. |
| **SEC-03** | Webhook Integrity & Replay Protection | **PASS** | `/api/webhooks/razorpay` verifies raw-body HMAC-SHA256 signatures, checks idempotency via `AuditLogModel` on `event_id`, and enforces the financial invariant (`amountPaise === order.total`). |
| **SEC-04** | Credential Isolation & Environment Protection | **PASS** | `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly server-only. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is exposed to the client. `.env` and `.env.local` are confirmed git-ignored and untracked. |
| **SEC-05** | Production Restriction of `/payment-test` | **FIXED & VERIFIED** | In production (`NODE_ENV === 'production'`), `/payment-test` invokes `notFound()` and Edge middleware returns 404. Test flags (`isDevTest`) are strictly forbidden in production. |
| **SEC-06** | Razorpay Enablement & Gateway Mode Verification | **FIXED & VERIFIED** | Gateway is verified in **Test Mode** (`rzp_test_TnRvg3LwstLPha`). Live customer payments remain safeguarded; COD is preserved as the default fallback until live credentials are configured. |
| **SEC-07** | Adversarial Automated Testing | **PASS** | 11 adversarial test scenarios implemented in `razorpay-production-security.test.ts`. All 11 passed (100%). |
| **SEC-08** | Full Regression & Monorepo Validation | **PASS** | 115 total tests passing across monorepo (`@ttrc/web` & `@ttrc/shared`), 0 TypeScript errors, 0 ESLint errors, and clean Next.js build (53/53 pages). |

---

## 3. Deep-Dive Remediation Analysis

### SEC-01: Server-Authoritative Order Creation (`/api/create-order`)
* **Pre-Audit Vulnerability:** `/api/create-order` previously accepted `body.amount` from the client request and created a Razorpay order without verifying the internal MongoDB order total. A malicious actor could have modified the payload to pay ₹1.00 for a ₹5,000.00 product.
* **Remediation Implemented:**
  1. The client no longer passes `amount`. It passes `orderNumber` and `orderId`.
  2. The endpoint verifies customer authentication via `getAuthenticatedUser()`. Unauthenticated requests return `401 Unauthorized`.
  3. Customer ownership is enforced: `order.user_id === user.id` (or admin). Mismatches return `403 Forbidden` (IDOR defense).
  4. The order amount is loaded strictly from the authoritative database record: `const authoritativeAmountPaise = order.total`.
  5. The endpoint checks for existing active Razorpay order IDs and reuses them idempotently to prevent duplicate order generation.
  6. The generated `razorpay_order_id` is persisted into MongoDB on the Order document before the response is returned to the client.

### SEC-02: Authoritative Payment Verification (`/api/verify-payment`)
* **Pre-Audit Vulnerability:** The verification route only checked the cryptographic signature and updated MongoDB based on order matching without customer authentication or verifying actual payment capture status on Razorpay's servers.
* **Remediation Implemented:**
  1. **Customer Ownership:** Authenticates user and checks `order.user_id === user.id`. Cross-user payment verification attempts are rejected with `403 Forbidden`.
  2. **Order ID Binding:** Verifies that `body.razorpay_order_id` strictly matches `order.razorpay_order_id` stored in MongoDB.
  3. **Timing-Safe Signature:** Employs `crypto.timingSafeEqual` over HMAC-SHA256 digests to eliminate side-channel timing attacks.
  4. **Gateway Status & Invariant Check:** Calls `razorpay.payments.fetch(paymentId)` via the official server SDK:
     - Confirms `payment.order_id === order.razorpay_order_id`.
     - Confirms `payment.currency === 'INR'`.
     - Confirms `payment.amount === order.total` (strict integer paise equality).
     - Confirms `payment.status === 'captured'` (or triggers server-side capture if status is `'authorized'`). Rejects uncaptured, pending, or failed payments.
  5. **Idempotency:** If the order is already marked `paid` with the same `paymentId`, returns `200 OK` with `{ idempotent: true }` without redundant database writes.

### SEC-03: Webhook Verification (`/api/webhooks/razorpay`)
* **Audit Findings:**
  1. Signature verification is performed on the raw request text body (`request.text()`) using `RAZORPAY_WEBHOOK_SECRET`.
  2. Idempotency is verified against `AuditLogModel` on `metadata.event_id` to safeguard against duplicate webhook deliveries.
  3. Underpayment and overpayment discrepancies trigger a security flag on the order notes and prevent automated fulfillment.

### SEC-04: Credential & Environment Protection
* **Audit Findings:**
  - `git ls-files .env* apps/web/.env*` confirms that `.env` and `.env.local` are untracked by Git.
  - `.gitignore` contains `.env*` with exception only for `.env.example`.
  - Secret scanning confirms no private secrets (`RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET`) are committed or leaked to client bundles. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is exposed to browser scripts.

### SEC-05: Lockdown of `/payment-test`
* **Remediation Implemented:**
  - Route component `apps/web/src/app/payment-test/page.tsx` now calls `notFound()` when `process.env.NODE_ENV === 'production'`.
  - Edge middleware in `apps/web/src/middleware.ts` rejects any requests starting with `/payment-test` in production with `404 Not Found`.
  - API endpoints reject `{ isDevTest: true }` with `403 Forbidden` when running in production.

### SEC-06: Gateway Mode & Razorpay Enablement
* **Audit Findings:**
  - Active Key ID: `rzp_test_TnRvg3LwstLPha` (Prefix `rzp_test_` confirms **Test Mode**).
  - The live orders API call verified in testing was executed against Razorpay's sandbox/test environment.
  - Cash on Delivery (COD) remains fully operational. When switching to live mode, only the environment variables need to be updated in Vercel to `rzp_live_...`.

---

## 4. Adversarial Test Evidence

The dedicated adversarial test suite [`apps/web/tests/security/razorpay-production-security.test.ts`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/tests/security/razorpay-production-security.test.ts) executed 11 security test cases:

```bash
$ vitest run tests/security/razorpay-production-security.test.ts

 ✓ tests/security/razorpay-production-security.test.ts (11 tests) 43ms
   ✓ 1. Server-Authoritative Order Creation Security (/api/create-order)
     ✓ PREVENTS PRICE MANIPULATION: Ignores client-supplied amount and enforces DB total
     ✓ REJECTS unauthenticated requests
     ✓ PREVENTS IDOR: Customer A cannot create payment for Customer B order
   ✓ 2. Authoritative Payment Verification (/api/verify-payment)
     ✓ REJECTS payment verification if Customer A tries to verify Customer B order
     ✓ REJECTS verification if Razorpay order ID does not match internal order record
     ✓ REJECTS verification if payment amount on Razorpay mismatches order total
     ✓ HANDLES IDEMPOTENCY: Repeat calls for already-paid order return 200 without duplicate mutation
   ✓ 3. Webhook Integrity & Replay Protection (/api/webhooks/razorpay)
     ✓ REJECTS webhook with invalid signature
     ✓ PREVENTS REPLAY ATTACKS: Skips already processed webhook eventId
   ✓ 4. Environment & Test Route Lockdown
     ✓ RESTRICTS developer test payment creation in production
     ✓ RESTRICTS developer test payment verification in production

Test Files  1 passed (1)
     Tests  11 passed (11)
```

---

## 5. Regression & Build Validation

### 1. Monorepo Unit Test Suite
```bash
$ turbo test:unit
 Tasks:    2 successful, 2 total (115 unit tests passing)
 @ttrc/shared:  31 passed
 @ttrc/web:     84 passed
```

### 2. TypeScript Strict Mode
```bash
$ turbo typecheck
 Tasks:    3 successful, 3 total (0 type errors across all packages)
```

### 3. ESLint Verification
```bash
$ pnpm --filter @ttrc/web lint --quiet
 Tasks:    1 successful (0 lint errors)
```

### 4. Next.js Production Build
```bash
$ next build
✓ Compiled successfully in 27.9s
✓ Generating static pages using 7 workers (53/53) in 17.4s
├ ƒ /api/create-order
├ ƒ /api/verify-payment
├ ƒ /api/webhooks/razorpay
├ ƒ /checkout
└ ƒ /payment-test (guarded with 404 in production)
```

---

## 6. Manual Actions for Live Production Deployment

1. **Keep Test Mode Active During Staging Verification**:
   - Verify that test orders complete without charging real cards.
2. **Onboarding Live Razorpay Credentials**:
   - Once KYC and bank account activation are complete on the Razorpay Dashboard, generate **Live API Keys**.
   - Add the live credentials to Vercel Project Settings:
     - `RAZORPAY_KEY_ID`: `rzp_live_...`
     - `RAZORPAY_KEY_SECRET`: Live Key Secret
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Same `rzp_live_...`
     - `RAZORPAY_WEBHOOK_SECRET`: Secret defined in Razorpay Webhook settings
3. **Configure Razorpay Webhook in Dashboard**:
   - Webhook URL: `https://www.ttrc.store/api/webhooks/razorpay`
   - Active Events: `payment.captured`, `payment.failed`, `refund.processed`
   - Secret: Match `RAZORPAY_WEBHOOK_SECRET`.

---

## 7. Release Recommendation

**Verdict: CONDITIONAL GO (Production Safe)**  
The Razorpay integration is architecturally secure and resistant to price manipulation, IDOR attacks, signature tampering, and webhook replays. Live payments can be activated at any time by swapping environment variables with zero code changes required.
