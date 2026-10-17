# TTRC Store — Comprehensive Production Readiness Audit Report

**Platform**: TTRC Store (`https://www.ttrc.store/`)  
**Operating Entity**: Tamizh Tech (`https://www.tamizhtech.in/`), Tamil Nadu, India  
**Auditor**: Senior Full-Stack, Security, Payments & DevOps Lead  
**Audit Date**: October 16, 2026  
**Authoritative Database**: MongoDB Atlas Cluster (`ttrc_store`)  
**Payment Gateway**: Razorpay Standard Checkout (UPI, Cards, Netbanking) — COD Disabled  
**Overall Release Recommendation**: **CONDITIONAL GO** (Zero Critical/High code defects; live dashboard credential setup & apex domain DNS unification required)

---

## 1. Executive Summary

A comprehensive, evidence-driven production readiness audit was performed across the entire TTRC Store codebase, infrastructure bindings, and public deployment surfaces. The scope encompassed payment state machine integrity, webhook replay defense, inventory concurrency invariants, cryptographic authentication, role-based access control, IDOR protection, domain health, and automated regression suites.

### Key Audit Findings
1. **Financial & Payment Integrity**: Verified server-authoritative pricing and currency checks. Razorpay HMAC-SHA256 signature verification uses timing-safe comparison on raw request bodies. Webhooks enforce durable deduplication via MongoDB audit logging (`event_id`), and `payment.failed` transitions are atomic and idempotent.
2. **Inventory Concurrency**: Atomic conditional updates (`stock_quantity: { $gte: qty }`) strictly prevent overselling. Pending checkout releases and webhook failure restocks use atomic single-document transitions, preventing duplicate restock events.
3. **Security Posture**: Edge Middleware cryptographically validates JWT tokens; test bypasses are unconditionally rejected in production; public registration blocks role escalation; upload endpoints check binary magic bytes and restrict access to admins; search queries are sanitized and length-capped; CSP, HSTS, and clickjacking headers are active.
4. **Domain & Deployment Health**: Canonical domain `https://www.ttrc.store/` and secondary domain `https://www.ttrc.shop/` (301 redirecting to canonical) are verified live with valid SSL certificates. Vercel deployment `https://ttrc-store.vercel.app/` is live (HTTP 200). Apex `tamizhtech.in` was empirically observed to have conflicting DNS records (AWS Global Accelerator + Vercel) causing SSL handshake errors, requiring DNS consolidation.
5. **Release Decision**: **CONDITIONAL GO**. All code-level gates, unit tests (169/169), typecheck (3/3), lint (0 errors), and production builds pass. Release proceeds upon completing the external dashboard configuration detailed in Section 7.

---

## 2. Baseline Test Execution Results

All commands were executed directly against the local and deployed environments:

| Check | Command Line | Result | Metrics / Observations |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict** | `pnpm turbo typecheck` | **PASS** | 3/3 packages clean; 0 errors (`@ttrc/web`, `@ttrc/shared`, `@ttrc/ui-tokens`). |
| **ESLint Static Analysis** | `pnpm turbo lint` | **PASS** | 0 errors, 485 warnings (principally test mock typings). |
| **Full Unit Test Suite** | `pnpm test:unit` | **PASS** | 14 test files; 169 tests executed; 169 passed; 0 failed. |
| **Security Audit Script** | `pnpm security:audit` | **PASS** | 34/34 security controls passed (100% health score). |
| **Security Release Gate** | `pnpm security:gate` | **PASS** | 10/10 live checks passed against production endpoints. |
| **Production Build** | `pnpm turbo build` | **PASS** | Compiled in 11.5s via Turbopack; 54/54 static/dynamic routes generated. |
| **Domain Health Audit** | Node/cURL Network Inspection | **PARTIAL** | `www.ttrc.store`, `www.ttrc.shop`, `ttrc-store.vercel.app` 200/301/308 OK; `tamizhtech.in` has DNS collision. |

---

## 3. Defect & Finding Register

| Finding ID | Category | Severity | Status | Affected Component | Description & Evidence | Remediation Applied / Required |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **SEC-001** | Payments | High | **PASS** | `/api/webhooks/razorpay` | Delayed `payment.failed` webhook could potentially cancel an already paid order if arriving out-of-order. | Implemented atomic `findOneAndUpdate` querying `{ status: 'pending', payment_status: 'pending' }`. If order is already paid, restock is safely skipped. |
| **SEC-002** | Payments | High | **PASS** | `/api/webhooks/razorpay` | Duplicate `payment.failed` webhook replays could trigger multiple inventory restocks. | Atomic status transition to `cancelled` guarantees only the first execution matches and restocks. |
| **SEC-003** | Inventory | High | **PASS** | `actions/checkout.ts` | Abandoned checkout reservations could tie up stock indefinitely if customer closed tab. | Implemented `cleanupExpiredPendingOrdersAction` with a 30-minute safety threshold. |
| **SEC-004** | Auth/IDOR | Critical | **PASS** | `/api/verify-payment` | Unauthorized callers could attempt to verify payment for other customers' orders. | Enforced strict ownership: authenticated `user.id` or normalized `guest_email` must match order record. |
| **SEC-005** | Security | Medium | **PASS** | `globals.css` | Residual purple styling utilities on button components conflicted with white + red platform theme. | Aliased semantic tokens to brand palette and verified storefront button styling. |
| **DOM-001** | DNS/DevOps | Medium | **BLOCKED** | DNS (`tamizhtech.in`) | Apex domain `tamizhtech.in` has competing A records (AWS `3.33.130.190`, `15.197.148.33` vs Vercel `76.76.21.21`), causing SSL Alert 112. | Requires registrar DNS edit to remove stale AWS Global Accelerator IPs and point strictly to Vercel. |
| **OPS-001** | Observability | Low | **PARTIAL** | `error.tsx` | Sentry DSN not yet wired to live Sentry project in production environment. | Fallback structured console logging active with correlation IDs; Sentry DSN to be added to Vercel env. |

---

## 4. Payment & Checkout Architecture Review

1. **Authoritative Calculation**:
   - Product prices, GST rates (CGST/SGST/IGST), coupon discounts, and shipping fees are calculated entirely on the server from MongoDB database records. Client-provided subtotals and totals are discarded.
2. **Payment Method Lockdown**:
   - Cash on Delivery (COD) is strictly disabled in code and UI. Razorpay is the sole authoritative payment gateway.
3. **Signature & Amount Verification**:
   - `/api/verify-payment` enforces timing-safe HMAC-SHA256 signature verification and performs a secondary server-side fetch from the Razorpay API (`payments.fetch`) to verify `amount === order.total`, `currency === 'INR'`, and `status === 'captured'`.

---

## 5. Security & Authorization Audit

- **Edge Authentication**: Next.js middleware verifies HMAC-SHA256 JWT tokens with Web Crypto API before granting access to `/admin` or `/account` routes.
- **Role Escalation Prevention**: Registration endpoint schema restricts user roles to `customer`. Any attempts to supply `role: 'admin'` are rejected.
- **Upload Hardening**: Media uploads verify binary magic bytes (PNG `89 50 4E 47`, JPEG `FF D8 FF`, WebP `52 49 46 46`), cap file size at 5MB, and generate cryptographically randomized file keys to prevent path traversal.
- **Headers & CSP**: HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict Content Security Policy allowing only verified Razorpay and font CDNs.

---

## 6. Public Domain & Deployment Metrics

Empirically inspected via live network requests:

| Target Endpoint | DNS IP(s) | Status | TLS Expiration | Headers / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `https://www.ttrc.store/` | `216.198.79.1` | **200 OK** | Jan 9, 2027 | Canonical Storefront. Vercel Anycast (bom1). CSP, HSTS, XFO active. |
| `https://ttrc.store/` | `216.198.79.1` | **308 Perm** | Jan 9, 2027 | Redirects to `https://www.ttrc.store/`. |
| `https://www.ttrc.shop/` | `64.29.17.65` | **301 Perm** | Jan 9, 2027 | Redirects to `https://www.ttrc.store/`. Preserves SEO equity. |
| `https://ttrc.shop/` | `216.198.79.1` | **308 Perm** | Jan 9, 2027 | Redirects to `www.ttrc.shop` $\rightarrow$ `www.ttrc.store`. |
| `https://ttrc-store.vercel.app/` | `216.198.79.195` | **200 OK** | Nov 27, 2026 | Direct Vercel deployment alias. Healthy. |
| `https://www.tamizhtech.in/` | `76.76.21.93` | **200 OK** | Jan 2, 2027 | Main company portal. Healthy. |
| `https://tamizhtech.in/` | Multiple IPs | **FAIL** | N/A | SSL handshake failure (unrecognized name) due to mixed AWS + Vercel A records. |

---

## 7. Action Plan for Final Launch

To transition from **CONDITIONAL GO** to **FINAL LIVE GO**, the following human operator actions must be executed:

1. **DNS Cleanup for `tamizhtech.in`**:
   - Access domain registrar (e.g., GoDaddy / Cloudflare).
   - Remove stale A records pointing to `3.33.130.190` and `15.197.148.33`.
   - Ensure apex A record points solely to Vercel Anycast `76.76.21.21` (or CNAME flattening).
2. **Razorpay Live Credentials**:
   - In Vercel Project Settings > Environment Variables, verify production keys: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
   - In Razorpay Dashboard > Settings > Webhooks, add endpoint `https://www.ttrc.store/api/webhooks/razorpay` subscribing to events `payment.captured`, `payment.failed`, `order.paid`.
3. **Monitoring & Error Alerts**:
   - Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel environment variables for automated 5xx telemetry.
