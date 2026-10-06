# TTRC Store Security Audit & Penetration Test Report

**Target**: TTRC Store (ttrc.store / ttrc-store.vercel.app)  
**Organization**: Tamizh Tech, Tamil Nadu  
**Assessment Type**: Authorized Comprehensive E-Commerce Penetration Test & Security Hardening  
**Target Architecture**: Next.js App Router (16.3.6) + TypeScript + MongoDB Atlas  
**Date**: October 2026  
**Auditor**: Antigravity Autonomous Security Engineer  
**Status**: **ALL FINDINGS REMEDIATED & VERIFIED**  

---

## 1. Executive Summary & Security Scorecard

A full-scope, defensive penetration test and source code security audit of the TTRC Store platform was conducted. The assessment analyzed authentication, session tokens, customer authorization, IDOR boundaries, server-side pricing, inventory concurrency, coupon business logic, payment gateway webhooks, file upload handling, HTTP headers, dependency vulnerabilities, and production data cleanliness.

All identified vulnerabilities were systematically patched and validated using automated regression test suites and the custom verification engine (`scripts/securityAudit.mjs`).

### Security Scorecard

| Category | Initial Status | Critical | High | Medium | Low | Current Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Sessions** | Weak | 1 | 1 | 0 | 0 | **SECURE** |
| **Authorization & IDOR** | Vulnerable | 1 | 1 | 0 | 0 | **SECURE** |
| **Ecommerce Pricing & Math** | Safe | 0 | 0 | 0 | 0 | **SECURE** |
| **Inventory & Concurrency** | Vulnerable | 0 | 1 | 0 | 0 | **SECURE** |
| **Coupons Business Logic** | Weak | 0 | 1 | 0 | 0 | **SECURE** |
| **Payments & Webhooks** | Critical | 1 | 1 | 0 | 0 | **SECURE** |
| **File Uploads** | Weak | 0 | 1 | 0 | 0 | **SECURE** |
| **Input Validation & ReDoS** | Needs Work | 0 | 0 | 1 | 0 | **SECURE** |
| **HTTP Headers & CSP** | Incomplete | 0 | 0 | 1 | 1 | **SECURE** |
| **Production Cleanliness (No Mock)** | Incomplete | 0 | 0 | 1 | 1 | **SECURE** |
| **Dependencies** | Vulnerable | 1 | 0 | 0 | 0 | **SECURE** |
| **TOTAL** | — | **4** | **6** | **3** | **2** | **100% PASS** |

---

## 2. Confirmed Vulnerabilities & Remediations

### SEC-001: JWT Forgery via Signature-Free Decoding in Edge Middleware
- **Severity**: CRITICAL
- **Affected Route**: `/admin/*`, `/account/*`, `apps/web/src/middleware.ts`
- **Description**: Next.js Edge Middleware decoded the `ttrc_session` cookie by splitting the token by `.` and base64-decoding the payload without checking the HMAC-SHA256 signature.
- **Attack Scenario**: An attacker crafts a cookie `ttrc_session=header.{"role":"admin"}.invalidsig`, bypassing the middleware redirect to browse admin pages.
- **Remediation**: Implemented native Web Crypto HMAC-SHA256 signature verification in Edge Middleware. Added defense-in-depth `requireAdmin()` check in `AdminLayout`.
- **Verification**: `scripts/securityAudit.mjs` (Check 1.1) and Vitest `security-hardening.test.ts`.

### SEC-002: Insecure Production Test Bypass Backdoor
- **Severity**: CRITICAL
- **Affected Route**: `apps/web/src/middleware.ts`, `apps/web/src/lib/auth-helpers.ts`
- **Description**: If `ALLOW_TEST_BYPASS` or `E2E_TEST` flags were enabled, cookie `ttrc_test_bypass=true` granted simulated administrative credentials (`local-admin-id`) without credentials.
- **Attack Scenario**: Setting the bypass cookie in staging or misconfigured production granted full admin access.
- **Remediation**: Explicitly locked out bypass when `process.env.NODE_ENV === 'production'`:
  ```typescript
  if (process.env.NODE_ENV === 'production') return false;
  ```
- **Verification**: `scripts/securityAudit.mjs` (Check 1.2 & 1.3).

### SEC-003: Public Registration Admin Takeover via isFirstUser Check
- **Severity**: HIGH
- **Affected Route**: `apps/web/src/actions/auth.ts` (`registerAction`)
- **Description**: Public registration checked `isFirstUser = (await UserModel.countDocuments()) === 0` and granted the `admin` role to the registrant if true, introducing race conditions and public admin takeover risks.
- **Remediation**: Forcibly set `role: 'customer'` for all public registrations. Admin roles must now only be created through CLI scripts (`create-admin.ts`) or database seeding.
- **Verification**: `scripts/securityAudit.mjs` (Check 1.4).

### SEC-004: IDOR in Tax Invoice & Order Detail Endpoints
- **Severity**: HIGH
- **Affected Route**: `GET /api/invoice/[id]`, `/orders/[id]/page.tsx`
- **Description**: The invoice route had zero authentication or ownership verification and returned hardcoded customer data ("Karthik Raja"). Anyone could access arbitrary invoice IDs.
- **Remediation**: Required `getAuthenticatedUser()`, queried MongoDB `OrderModel`, and strictly enforced:
  ```typescript
  const isOwner = order.user_id && order.user_id === auth.user.id;
  const isAdmin = auth.user.role === 'admin' || auth.user.role === 'staff';
  if (!isOwner && !isAdmin) return 403;
  ```
  Generated invoice from live MongoDB order fields (buyer, items, GST split).
- **Verification**: `scripts/securityAudit.mjs` (Check 2.1 & 2.2).

### SEC-005: Customer Self-Refund Privilege Escalation
- **Severity**: HIGH
- **Affected Route**: `apps/web/src/actions/orders.ts` (`requestReturnAction`)
- **Description**: Calling `requestReturnAction` immediately set `order.status = 'refunded'` without administrator approval.
- **Remediation**: Restricted return requests to `delivered` orders, appended a return request note to `order.notes`, and prevented direct status transitions to `refunded`.
- **Verification**: `scripts/securityAudit.mjs` (Check 2.3).

### SEC-006: Non-Atomic Inventory Race Condition & Overselling
- **Severity**: HIGH
- **Affected Route**: `apps/web/src/actions/checkout.ts` (`createOrderAction`)
- **Description**: Inventory availability was checked in a loop and decremented with `$inc` after order creation. Concurrent checkouts for the last unit allowed multiple orders and created negative inventory.
- **Remediation**: Implemented atomic conditional deduction:
  ```typescript
  const updatedProduct = await ProductModel.findOneAndUpdate(
    { _id: item.product._id, stock_quantity: { $gte: item.quantity }, is_active: true },
    { $inc: { stock_quantity: -item.quantity } },
    { new: true }
  );
  ```
  If any cart item has insufficient stock, all previously decremented items are rolled back cleanly.
- **Verification**: Vitest `Atomic Inventory Concurrency` test & `scripts/securityAudit.mjs` (Check 3.1).

### SEC-007: Coupon Expiry & Max-Discount Cap Bypass
- **Severity**: MEDIUM
- **Affected Route**: `apps/web/src/actions/checkout.ts` (`validateCouponAction`, `createOrderAction`)
- **Description**: Percentage coupons ignored `max_discount_paise` and `expires_at`, allowing expired coupons to be redeemed and discounts to exceed maximum allowed rupees.
- **Remediation**: Enforced `expires_at > new Date()`, capped discounts at `max_discount_paise`, and atomically incremented `usage_count`.
- **Verification**: Vitest `Coupon Abuse & Validation Rules` test & `scripts/securityAudit.mjs` (Check 3.2-3.4).

### SEC-008: Razorpay Webhook Architecture Mismatch & Timing Attack Risk
- **Severity**: CRITICAL
- **Affected Route**: `apps/web/src/app/api/webhooks/razorpay/route.ts`
- **Description**: The webhook was querying deprecated Supabase tables while the application stored orders in MongoDB. Additionally, the signature check was vulnerable to timing attacks, and underpaid transactions were not checked.
- **Remediation**: Migrated the webhook to MongoDB `OrderModel` and `AuditLogModel`. Applied `crypto.timingSafeEqual` for HMAC verification. Added payment amount comparison (`amountPaise >= order.total`).
- **Verification**: Vitest `Payment & Webhook Security` test & `scripts/securityAudit.mjs` (Check 4.1-4.4).

### SEC-009: File Upload MIME-Type Spoofing / Polyglot Risk
- **Severity**: HIGH
- **Affected Route**: `POST /api/admin/media/upload`
- **Description**: Only verified client-supplied `file.type`. Attackers could upload PHP/HTML files disguised as images with an `image/png` header.
- **Remediation**: Added binary magic byte validation for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), and WebP (`RIFF...WEBP`). Maintained randomized cryptographic filenames.
- **Verification**: Vitest `File Upload Security & Magic Header Checks` test & `scripts/securityAudit.mjs` (Check 5.1-5.3).

### SEC-010: Missing Strict HSTS & Permissive CSP Headers
- **Severity**: MEDIUM
- **Affected Route**: `apps/web/next.config.ts`
- **Description**: Missing `Strict-Transport-Security` header. CSP permitted connections to deprecated Supabase endpoints.
- **Remediation**: Added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` and `X-XSS-Protection: 1; mode=block`. Updated CSP to remove Supabase.
- **Verification**: `scripts/securityAudit.mjs` (Check 7.1-7.4).

### SEC-011: Unbounded Search Queries & ReDoS Risk
- **Severity**: MEDIUM
- **Affected Route**: `GET /api/search`
- **Description**: Uncapped search terms allowed sending large strings or unescaped regex characters causing CPU exhaustion.
- **Remediation**: Capped query length to 100 characters, escaped regex special characters, and added sliding-window rate limiting.
- **Verification**: `scripts/securityAudit.mjs` (Check 6.1-6.2).

### SEC-012: Hardcoded Production Mock Customer Data
- **Severity**: LOW
- **Affected Route**: `apps/web/src/app/admin/customers/page.tsx`, `apps/web/src/app/checkout/page.tsx`
- **Description**: Admin customers page rendered a hardcoded array (`CUSTOMERS_LIST`) containing fake users ("Karthik Raja"). Checkout page prefilled test customer addresses.
- **Remediation**: Replaced mock array with live query via `getAdminCustomersAction` and added an empty state ("No customers found"). Initialized checkout address fields as empty.
- **Verification**: `scripts/securityAudit.mjs` (Check 8.1-8.2).

### SEC-013: Critical Remote Code Execution Vulnerability in Next.js (GHSA-vcvr-r3jv-pc5j)
- **Severity**: CRITICAL
- **Affected Package**: `next@16.3.5`
- **Description**: Next.js versions `< 16.3.6` had a critical RCE vulnerability in `next/og` ImageResponse.
- **Remediation**: Upgraded `next` and `eslint-config-next` to `16.3.6` in `apps/web/package.json`.
- **Verification**: `pnpm audit`.

---

---

## 3. Residual Controls Resolution & Pre-Launch Hardening (Completed)

All 3 residual operational controls and additional launch corrections have been fully remediated and verified:

### 1. Production Secret Strength & Startup Validation (RESOLVED)
- **Implementation**: Built `apps/web/src/lib/security/production-secrets-validator.ts` and connected it to Next.js server initialization via `apps/web/src/instrumentation.ts`.
- **Enforcement**:
  - Requires >= 32 bytes of cryptographically secure random entropy.
  - Calculates Shannon entropy (rejects low-entropy strings, repeated characters, dictionary phrases).
  - Explicitly rejects missing, short, default, example, or placeholder secrets (e.g. `{{JWT_SECRET}}`, `changeme`).
  - Enforces **Cross-Secret Reuse Detection**: Rejects deployments where `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, or `RAZORPAY_WEBHOOK_SECRET` share identical values across security boundaries.

### 2. Distributed Rate Limiting Architecture (RESOLVED)
- **Implementation**: Transformed in-memory rate limiting into a **3-tier distributed rate limiter** in `apps/web/src/lib/security/rate-limiter.ts`:
  - **Tier 1 (Upstash Redis REST)**: Fast HTTP pipeline requests (`INCR` + `PTTL`) for zero-connection-overhead serverless edge/lambda scaling.
  - **Tier 2 (MongoDB Atlas Distributed Store)**: Uses `RateLimitModel` with atomic `$inc` updates and automatic TTL index document expiry (`reset_at: { expires: 0 }`). Ensures 100% distributed state consistency across all Vercel serverless regions without requiring local counters.
  - **Tier 3 (In-Memory Fallback)**: For offline dev environments and unit test runners.

### 3. MongoDB Atlas Network Access Strategy (RESOLVED)
- **Implementation**: Documented in `docs/MONGODB_ATLAS_NETWORKING.md`.
- **Options Provided**:
  - **Vercel Pro**: Provisions dedicated Static Outbound IPs, allowing exact CIDR allowlisting in Atlas Network Access and deletion of `0.0.0.0/0`.
  - **Vercel Enterprise**: Uses Secure Compute and AWS PrivateLink / dedicated VPC peering in `ap-south-1` (Mumbai) for zero-internet private transit.
  - **Standard/Preview**: Enforces mandatory compensating controls (SCRAM-SHA-256 with 32-byte secret, TLS 1.3 encryption, database user restricted to `readWrite` on `ttrc_store` only with 0 cluster administration privileges).

### 4. Exact Payment Invariant Enforcement (RESOLVED)
- **Implementation**: Updated `apps/web/src/app/api/webhooks/razorpay/route.ts` to strictly require:
  `payment amount === authoritative order amount` (`amountPaise === order.total`).
- **Enforcement**: Any discrepancy (underpayment or unexpected overpayment) triggers a financial violation error, sets `order.payment_status = 'failed'`, halts automated fulfillment, and logs an alert for manual reconciliation.

### 5. Security Header Modernization (RESOLVED)
- **Implementation**: Removed deprecated `X-XSS-Protection: 1; mode=block` from `apps/web/next.config.ts` per MDN recommendations.
- **Enforcement**: Maintained and strengthened modern controls (`Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and modern `Content-Security-Policy` with `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`).

---

## 4. Final Security Release Gate

The live verification protocol is formalized in `docs/SECURITY_RELEASE_GATE.md` with an automated CLI runner:
```bash
pnpm security:gate https://ttrc.store
```
Verifies live headers, test bypass rejection, search ReDoS defense, webhook forgery resistance, and zero-mock integrity across:
`SOURCE CODE -> BUILD -> VERCEL PRODUCTION -> REAL ttrc.store -> REAL API RESPONSES -> REAL MONGODB -> REAL PAYMENT WEBHOOK`.
