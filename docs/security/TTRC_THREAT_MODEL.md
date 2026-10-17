# TTRC Store — Comprehensive Threat Model (STRIDE)
**Target Platform:** TTRC Store (`ttrc.store` / `ttrc.shop`)  
**Architecture:** Next.js (App Router) + MongoDB Atlas + Razorpay Standard Checkout + Resend Transactional Email  
**Document Classification:** Engineering Security Architecture  
**Date:** October 17, 2026

---

## 1. Scope & Objective

The objective of this Threat Model is to identify, analyze, and mitigate potential security threats to the TTRC Store ecommerce infrastructure across every tier of the transaction lifecycle. 

No single security control can guarantee immunity from compromise. Instead, this threat model applies **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege) and **Defense-in-Depth** principles to ensure that:
1. Unauthorized administrative access is prevented through multi-tiered controls.
2. Financial states (order payment status, amounts, discounts, and inventory) cannot be maliciously manipulated.
3. Customer Personally Identifiable Information (PII) is isolated and defended against IDOR/BOLA attacks.
4. Incidents are promptly detected, contained, and recoverable without loss of business continuity or paid orders.

---

## 2. Core Assets & Criticality Classification

| Asset ID | Asset Name | Description & Data Sensitivity | Criticality |
| :--- | :--- | :--- | :--- |
| **A-01** | **Admin Access & Dashboard** | Full administrative control over products, orders, settings, and refunds. | **CRITICAL** |
| **A-02** | **Payment Authority & State** | Razorpay keys, webhook secret, server-authoritative order totals, payment status transitions. | **CRITICAL** |
| **A-03** | **Database Records (MongoDB Atlas)** | Customer accounts, hashed credentials, order history, inventory counts, audit logs. | **CRITICAL** |
| **A-04** | **Customer PII** | Full names, delivery addresses, phone numbers, email addresses, order invoices. | **HIGH** |
| **A-05** | **Transactional Email & OTP (Resend)** | Verification codes, password resets, order receipts, sender reputation, daily quota. | **HIGH** |
| **A-06** | **Catalog & Inventory Consistency** | Real product stock quantities, pricing, discounts, coupons, and specifications. | **HIGH** |
| **A-07** | **Static Media & File Storage** | Product images, datasheets, invoices, public assets. | **MEDIUM** |

---

## 3. Threat Actor Personas

1. **Unauthenticated Public Attacker:**  
   Scans for exposed endpoints, leaked credentials, injection flaws, IDOR vulnerabilities, or open debug endpoints.
2. **Malicious Customer / Competitor:**  
   Attempts price/currency tampering, coupon reuse, negative inventory ordering, race condition exploitation, or cart manipulation.
3. **Automated Credential Stuffer / Botnet:**  
   Launches distributed brute-force attacks against `/login`, OTP verification, or product search endpoints to exhaust rate limits or hijack accounts.
4. **Opportunistic Payment Fraudster:**  
   Attempts to fake payment confirmation by replaying webhooks or forging client-side callbacks without settling funds at Razorpay.
5. **Compromised Administrative Identity:**  
   Stolen administrator session or credentials used to exfiltrate customer records, issue unauthorized refunds, or tamper with store settings.

---

## 4. STRIDE Threat Analysis by Architectural Tier

### Tier 1: Edge & Network (Vercel CDN, DNS, Reverse Proxy)

| STRIDE Category | Threat Scenario | Mitigation & Compensating Controls | Verification / Test |
| :--- | :--- | :--- | :--- |
| **Denial of Service (DoS)** | Volumetric L7 DDoS flooding search or checkout endpoints to exhaust serverless execution limits. | Vercel Edge Network DDoS mitigation, Upstash Redis distributed rate limiting on `/api/search` (60 req/min) and `/api/ai/*` (12 req/min). | Simulated concurrent load testing via test runner. |
| **Tampering** | Man-in-the-Middle (MitM) packet inspection or SSL stripping of customer traffic. | Strict HTTPS enforcement, HSTS (`max-age=63072000; includeSubDomains; preload`), canonical domain redirects (`ttrc.shop` -> `ttrc.store`). | SSL Labs validation, HTTP header inspection. |
| **Information Disclosure** | Caching of sensitive private account or admin responses on intermediate CDN nodes. | Explicit `Cache-Control: private, no-cache, no-store, must-revalidate` set on authenticated and admin routes. | Response header audit across `/account/*` and `/admin/*`. |
| **Elevation of Privilege** | Path traversal or test bypass header injection via proxy headers. | Middleware strips untrusted headers and enforces strict production checks forbidding `ttrc_test_bypass` when `NODE_ENV === 'production'`. | Automated test checking bypass rejection in production mode. |

---

### Tier 2: Identity & Access Management (Customer & Admin Auth)

| STRIDE Category | Threat Scenario | Mitigation & Compensating Controls | Verification / Test |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker guesses administrative password or utilizes hardcoded backdoor fallback. | Elimination of hardcoded fallbacks in `actions/auth.ts`, bcrypt password hashing (10 salt rounds), mandatory password rotation on first login, TOTP Multi-Factor Authentication. | Authentication tests asserting rejection of fallback credentials. |
| **Spoofing** | Brute-force OTP verification during password reset or login. | Server-authoritative 120s TTL, max 5 attempts with atomic invalidation, 60s cooldown, max 3 resends per 15 min, cryptographically secure 6-digit random codes (`crypto.randomInt`). | OTP security regression test suite. |
| **Elevation of Privilege** | Customer self-registration assigns or escalates role to `admin` or `staff`. | Strict server-side role assignment in `actions/auth.ts` forcing `role: 'customer'`, Zod schema blocking `role` from public input payload. | Unit test verifying registration payload with `{ role: 'admin' }` is ignored. |
| **Repudiation** | Administrator performs unauthorized refund or modifies price with no record of identity. | Structured audit logging via `AuditLogModel` recording `actor_id`, `action`, `ip_address`, `timestamp`, and `metadata` for all administrative actions. | Audit log inspection after executing administrative actions. |
| **Tampering** | Session fixation or forged JWT token signature. | Native Web Crypto HMAC-SHA256 signature verification in Edge Middleware, `HttpOnly`, `SameSite=lax`, `Secure` cookies, and session `token_version` tracking in database. | JWT forgery test ensuring tampered tokens are rejected. |

---

### Tier 3: Razorpay Payment Gateway & Checkout Lifecycle

| STRIDE Category | Threat Scenario | Mitigation & Compensating Controls | Verification / Test |
| :--- | :--- | :--- | :--- |
| **Tampering** | Customer modifies product price or total in browser payload before payment initiation. | Server-authoritative price calculation: `create-order` and `checkout` recalculate unit prices and totals directly from MongoDB database records. Client amounts are never trusted. | Checkout price-tampering test verifying client amount changes are ignored. |
| **Spoofing** | Fake payment completion webhook sent by attacker to mark an order as paid without transfer. | Webhook HMAC-SHA256 signature verification using `crypto.timingSafeEqual` with server-side `RAZORPAY_WEBHOOK_SECRET`. Gateway payment entity is fetched and validated directly. | Webhook signature test rejecting invalid signatures. |
| **Tampering** | Replayed or duplicate webhooks cause multiple inventory deductions or duplicate receipts. | Durable event deduplication using `event_id` indexed in `AuditLogModel`. Order status transition is atomic and idempotent (`payment_status: 'paid'`). | Webhook replay test verifying second delivery is acknowledged without side-effects. |
| **Elevation of Privilege** | Attacker initiates unauthorized refund for another customer's order. | Server-side authorization check `requireAdmin()` on refund actions, order existence and payment method validation, idempotency key on Razorpay refund calls. | Refund authorization test asserting non-admin caller is rejected. |

---

### Tier 4: Database (MongoDB Atlas)

| STRIDE Category | Threat Scenario | Mitigation & Compensating Controls | Verification / Test |
| :--- | :--- | :--- | :--- |
| **Information Disclosure** | Hardcoded credentials in source code allow direct database cluster access. | Complete removal of hardcoded URIs from source code, credentials supplied strictly via server environment variables, Atlas password rotation. | Static secret scanning in CI/CD pipeline. |
| **Tampering** | NoSQL query injection using user-controlled objects in query selectors (`$gt`, `$ne`). | Strict Zod validation on all endpoint inputs, explicit string casting or Mongoose schema validation before querying database. | Input validation tests with object payloads `{ $ne: null }`. |
| **Denial of Service** | Race conditions during high-volume sales causing overselling or negative inventory. | Atomic conditional updates using `{ stock_quantity: { $gte: qty } }` with `$inc: { stock_quantity: -qty }`, ensuring zero overselling under concurrency. | Concurrent checkout test simulating simultaneous purchases of last item. |

---

### Tier 5: Transactional Email & Messaging (Resend)

| STRIDE Category | Threat Scenario | Mitigation & Compensating Controls | Verification / Test |
| :--- | :--- | :--- | :--- |
| **Denial of Service** | Botnet spams "Forgot Password" or "Stock Alert" to exhaust Resend daily email quota. | Internal daily cap (90 emails/day) and monthly cap (2,700 emails/month), rate limiting on email triggers, priority gating for transactional vs marketing emails. | Quota enforcement test simulating quota threshold trigger. |
| **Information Disclosure** | Verification codes or sensitive links sent to unverified or attacker-controlled email addresses. | Rate limiting per destination email, generic success response ("If an account exists, a link has been sent") to prevent user enumeration. | Account enumeration test comparing timing and response bodies. |

---

## 5. Defense-in-Depth Implementation Strategy

```
+--------------------------------------------------------------------------+
| Layer 1: Edge & Network (Vercel CDN, HSTS, CSP, DDoS Protection)          |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Layer 2: Authentication & Session Gate (Edge Middleware HMAC-SHA256)      |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Layer 3: Server Actions & Zod Input Validation (Zero Trust Client Input)  |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Layer 4: Role-Based Authorization & IDOR Guards (requireAdmin, isOwner)   |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Layer 5: Financial Invariant Verification (Razorpay HMAC & DB Math)       |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Layer 6: Atomic Database Operations (MongoDB Atlas $gte, Audit Logs)     |
+--------------------------------------------------------------------------+
```

---

## 6. External Platform & Paid Plan Dependencies

To maintain clear technical transparency without assuming unavailable features:

| Platform | Desired Security Feature | Free / Current Plan Capability | Paid Plan Upgrade Required | Strong Safe Alternative Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** | Web Application Firewall (WAF) & Custom IP Rules | Standard Edge DDoS & basic rate limits | Vercel Enterprise / Pro WAF | Edge Middleware rate limiting + Next.js security headers & CSP |
| **Vercel** | Static Egress IP for Database Allowlisting | Dynamic IP pool for serverless functions | Vercel Secure Compute (Enterprise) | MongoDB Atlas SCRAM-SHA-256 authentication + strict least-privilege DB user |
| **MongoDB Atlas** | Dedicated VPC Peering / AWS PrivateLink | IP Access List (requires `0.0.0.0/0` for serverless) | Dedicated Cluster (M10+) + AWS VPC | TLS 1.3 enforced connections, strong generated passwords, least-privilege user scoped to `ttrc_store` only |
| **Razorpay** | Production Online Payments & Refunds | Test Key Mode / COD-only Fallback | Live Merchant Verification & API Keys | Full automated fallback to COD-only when Razorpay keys are omitted, with zero UI disruption |
| **Resend** | High-Volume Transactional Delivery | Free tier (100 emails/day, 3,000/mo) | Paid Pro Plan ($20/mo) | Internal quota protection (90/day, 2,700/mo) pausing non-critical alerts |
