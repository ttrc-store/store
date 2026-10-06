# TTRC Store Threat Model

**Application**: TTRC Store (ttrc.store / ttrc-store.vercel.app)  
**Company**: Tamizh Tech, Tamil Nadu  
**Architecture**: Next.js (App Router, Server Actions, Route Handlers) + MongoDB Atlas  
**Target Audience**: Robotics enthusiasts, students, STEM institutions, makers across India  
**Date**: October 2026  
**Standards**: OWASP Top 10, OWASP API Security Top 10, OWASP ASVS  

---

## 1. System Overview & Trust Boundaries

```
[ Internet / Public Clients ]
          │
          │ HTTPS (TLS 1.3) + HSTS
          ▼
┌────────────────────────────────────────────────────────┐
│ Vercel Edge Network / Next.js Edge Middleware          │
│ • Web Crypto HMAC-SHA256 JWT Signature Verification    │
│ • Production Test Bypass Lockout                       │
│ • Security Response Headers (CSP, HSTS, X-Frame-Options)│
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ Next.js App Router (Node.js Server Runtime)           │
│ • Server Actions with Zod Schema Validation            │
│ • requireAdmin() / requireAuth() Session Guards        │
│ • Authoritative Server-Side Pricing Engine             │
│ • Rate Limiting & Brute-Force Throttling              │
│ • Atomic Conditional Inventory Reservation             │
│ • Magic Byte File Header Verification                  │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ Authoritative Data Layer: MongoDB Atlas               │
│ • Parameterized Mongoose Models (No Raw Shell Eval)    │
│ • Atomic Conditional Operators ($gte, $inc, findOneAndUpdate)
│ • Strictly Private Fields (Cost, Landed, Admin Notes)  │
│ • Audit Log & Idempotency Storage                      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Threat Actors & Goals

### 2.1 Unauthenticated Internet Attacker
- **Capabilities**: Can send arbitrary HTTP requests, tamper with cookies, headers, query parameters, and API payloads.
- **Objectives**:
  - Forge administrative sessions to access the admin portal (`/admin`).
  - Access customer order details or invoices via predictable identifiers (IDOR).
  - Abuse login/register forms for credential stuffing, enumeration, or denial of service.
  - Submit malicious file uploads disguised as images to execute remote code.
  - Trigger ReDoS via expensive regex queries on the product search endpoint.
- **Defenses Implemented**:
  - Native Web Crypto HMAC signature verification in Edge Middleware rejecting forged JWTs.
  - Complete elimination of production test bypass backdoors (`NODE_ENV === 'production'`).
  - Sliding-window rate limiting on login, registration, coupon checks, and search.
  - Magic byte binary file signature inspection (JPEG, PNG, WebP) and cryptographically random filenames.
  - Strict length capping (100 chars) and regex escaping on search queries.

### 2.2 Authenticated Customer (User A vs. User B)
- **Capabilities**: Possesses a valid JWT session for customer account A.
- **Objectives**:
  - Access User B's order details, invoices, or delivery addresses.
  - Modify order states directly (e.g. self-refunding orders).
  - Manipulate prices, bulk tiers, discounts, or shipping charges during checkout.
  - Overspend coupons or bypass expiration and minimum order requirements.
- **Defenses Implemented**:
  - Session-derived user identity: Backend ignores client-supplied `userId` and binds queries to `auth.user.id`.
  - IDOR ownership validation in `/api/invoice/[id]` and `getMyOrderAction`.
  - Customers cannot transition orders to `refunded` or cancel orders that are already shipped/delivered.
  - Authoritative server-side pricing engine: Cart totals and line items are recomputed directly from MongoDB.
  - Coupons strictly validate `is_active`, `expires_at`, and apply `max_discount_paise` caps.

### 2.3 Automated Bot / Hoarder
- **Capabilities**: High-rate automated concurrent requests.
- **Objectives**:
  - Hoard or oversell inventory during flash sales by exploiting race conditions.
  - Repeatedly redeem single-use coupons across multiple concurrent checkouts.
  - Scrape the catalog or flood search APIs.
- **Defenses Implemented**:
  - Atomic conditional stock reservation: `ProductModel.findOneAndUpdate({ stock_quantity: { $gte: quantity } }, { $inc: { stock_quantity: -quantity } })` with automatic rollback on failure.
  - Atomic coupon usage count incrementation.
  - Rate limiting on API search and order placement.

### 2.4 Rogue Payment / Webhook Actor
- **Capabilities**: Can send spoofed HTTP POST requests to `/api/webhooks/razorpay`.
- **Objectives**:
  - Mark unpaid orders as paid without paying.
  - Replay legitimate webhook events to duplicate orders or trigger double refunds.
  - Pay ₹1 for a high-value order (amount tampering).
- **Defenses Implemented**:
  - Timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`).
  - Webhook event idempotency tracking in `AuditLogModel` via `event_id`.
  - Financial verification: Server asserts `paymentEntity.amount >= order.total`.

---

## 3. Threat Assessment Matrix

| Threat Category | STRIDE Category | Likelihood | Impact | Mitigations in Codebase |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Session Forgery** | Spoofing / Elevation | Low | Critical | Edge-level HMAC-SHA256 signature verification; double-checked in `AdminLayout`. |
| **Cross-Customer IDOR (Invoice/Order)** | Information Disclosure | Low | High | Server-side user identity derivation; strict owner vs. admin check on every record access. |
| **Inventory Overselling Race Condition** | Denial of Service / Tampering | Low | High | Atomic conditional MongoDB updates (`$gte`, `$inc`); automatic rollback on partial cart failure. |
| **Client-Side Price Manipulation** | Tampering / Financial | Negligible | Critical | Zero trust in client prices; server independently fetches DB prices, bulk tiers, and GST. |
| **Coupon Cap & Expiry Bypass** | Elevation of Privilege | Low | Medium | Expiration timestamp check, minimum order check, and `max_discount_paise` capping. |
| **Webhook Replay & Fake Payment** | Tampering / Repudiation | Low | Critical | Timing-safe HMAC verification, amount comparison, and audit log deduplication. |
| **Malicious File Upload / Polyglot** | Remote Code Execution | Low | Critical | Magic byte inspection, randomized server filenames, 5MB size limit, admin-only access. |
| **Search ReDoS & Scraping** | Denial of Service | Low | Medium | 100-character input capping, regex escaping, sliding-window IP rate limiting. |
| **Clickjacking / Framing** | Information Disclosure | Negligible | Medium | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`. |
| **Production Mock Data Exposure** | Information Disclosure | Negligible | Low | Complete purge of hardcoded mock records; empty states implemented across storefront & admin. |
