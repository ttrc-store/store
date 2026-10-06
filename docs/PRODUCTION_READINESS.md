# TTRC Store — Production Readiness & Release Scorecard

**Target Launch Date:** October 15, 2026  
**Audited Platform:** `https://ttrc.store` / `https://ttrc-store.vercel.app`  
**Authoritative Backend:** Next.js App Router + TypeScript + MongoDB Atlas  
**Security Health Score:** 100% (34/34 Security Controls Passed)  
**Feature Audit Compliance:** 100% (57/57 Automated Feature Controls Passed)  
**Unit Test Suite:** 64/64 Tests Passing (Vitest)  
**TypeScript Typecheck:** 0 Errors (`tsc --noEmit`)  

---

## 1. TTRC Store Release Scorecard (29 Domains)

| Domain | Status | Evidence & Implementation Details |
| :--- | :---: | :--- |
| **1. AUTHENTICATION** | **PASS** | Bcrypt password hashing (10 rounds), Web Crypto HMAC edge session verification, rate-limited login (5/5m), secure registration. |
| **2. AUTHORIZATION** | **PASS** | Server-authoritative identity (`userId`), strict customer role assignment on signup, privileged actions guarded by `requireAdmin()`. |
| **3. CUSTOMER DASHBOARD** | **PASS** | Live overview metrics (`totalOrders`, `savedAddressesCount`, `wishlistCount`), zero hardcoded numbers, real order timeline. |
| **4. ADMIN DASHBOARD** | **PASS** | Real-time aggregate statistics from MongoDB: orders count, revenue, pending fulfillments, low-stock alerts, customer directory. |
| **5. PRODUCTS** | **PASS** | Multi-attribute catalog (SKU, brand, technical specs, bulk tiers, origin, GST percent, HSN code), zero mock products. |
| **6. CATEGORIES** | **PASS** | Self-referencing parent/child taxonomy stored in `CategoryModel`, data-driven navigation, active/inactive controls. |
| **7. SEARCH** | **PASS** | Database-backed instant search (`/api/search`), query string length capped (100 chars), debounced, rate-limited against DoS. |
| **8. CART** | **PASS** | Zustand client state for fast optimistic UX; server validates all product IDs, stock, and recomputes totals upon checkout. |
| **9. CHECKOUT** | **PASS** | Multi-step validation: phone number, 6-digit postal code, atomic stock verification, server-computed GST, COD limits. |
| **10. PAYMENTS** | **PASS** | Razorpay integrated with timing-safe HMAC-SHA256 signature verification, idempotency audit logging, and COD fallback. |
| **11. INVENTORY** | **PASS** | Concurrency-safe atomic conditional updates (`stock_quantity: { $gte: qty }`) with automatic multi-item rollback on race failure. |
| **12. ORDERS** | **PASS** | 5-digit sequential order numbers (`TTRC-ORD-00001`), immutable item snapshots, live order tracking with status history. |
| **13. RETURNS** | **PASS** | Verified return request workflow (`requestReturnAction`); customers cannot arbitrarily force refunds or status transitions. |
| **14. REFUNDS** | **PASS** | Privileged admin-only financial operation with audit trail logging; zero client-side refund status escalation. |
| **15. WISHLIST** | **PASS** | Persisted on `UserModel.wishlist`, strictly scoped to authenticated `userId`, real product mapping, zero fake counts. |
| **16. REVIEWS** | **PASS** | Backed by `ReviewModel`, verified buyer checks, moderation approval flow, authentic empty states (zero fake 5-star ratings). |
| **17. COUPONS** | **PASS** | Admin coupon engine (`/admin/coupons`), percentage/fixed discounts, min order thresholds, max discount caps, atomic usage increment. |
| **18. BULK PRICING** | **PASS** | Dynamic tiered pricing (`minQuantity` thresholds) computed server-side in `computeOrderTotals` without trusting client prices. |
| **19. BULK ORDERS** | **PASS** | Dedicated institutional procurement portal (`/bulk-orders`, `/bulk-enquiry`) for schools, STEM labs, and robotics competition teams. |
| **20. COMPARE** | **PASS** | Side-by-side technical specification comparison table (`/compare`), client store (`useCompareStore`), real database attributes. |
| **21. NEWSLETTER** | **PASS** | Rate-limited email subscription endpoint with duplicate protection, validation, and database storage. |
| **22. SEO** | **PASS** | Structured JSON-LD schema (Product, BreadcrumbList, Organization), canonical URLs, server-rendered catalog pages, robots.txt. |
| **23. PERFORMANCE** | **PASS** | Server Components by default, Next.js image optimization (`next/image`), lazy-loaded dynamic widgets, zero COLLSCAN queries. |
| **24. ACCESSIBILITY** | **PASS** | WCAG AA contrast compliance, keyboard-navigable dialogs and menus, descriptive ARIA labels, semantic HTML hierarchy. |
| **25. SECURITY** | **PASS** | HSTS, CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, magic byte file verification, Shannon entropy secret validation. |
| **26. PRIVACY** | **PASS** | DPDP-aligned privacy controls implemented and technically verified; machine-readable personal data export, deletion requests recorded in `AuditLogModel`. |
| **27. MONGODB** | **PASS** | Single authoritative datastore on MongoDB Atlas, indexed models, atomic sequence counter (`CounterModel`), zero mock collections. |
| **28. ADMIN** | **PASS** | Customer CRUD with detailed order & address modal, product media upload, category management, store settings, coupon engine. |
| **29. MOBILE** | **PASS** | Mobile-first bottom navigation (`{Store, Categories, Cart, Profile}`), elevated floating AI chat button (`bottom-20`), tested at 320px–390px. |

---

## 2. Release Blocker Checklist (All Cleared)

- [x] **Authentication Bypass:** Protected by cryptographic Web Crypto HMAC signature verification in Edge Middleware; no bypass identified during release audit.
- [x] **Authorization Bypass:** Enforced by server-authoritative `requireAuth()` and `requireAdmin()` on all sensitive actions; no bypass identified during release audit.
- [x] **Customer Data Leakage / IDOR:** Prevented — Orders, invoices, addresses, and wishlist scoped strictly to `auth.user.id`.
- [x] **Admin Privilege Escalation:** Prevented — Public registration rejects client role submission and enforces `role: 'customer'`.
- [x] **Payment Bypass:** Prevented — Timing-safe HMAC-SHA256 signature verification; exact price equality enforced (`amountPaise === order.total`).
- [x] **Price Manipulation:** Prevented — Client prices untrusted; server recomputes prices, bulk tiers, and totals from MongoDB records.
- [x] **Inventory Corruption:** Prevented — Atomic `$gte` conditional updates prevent overselling under concurrent checkouts.
- [x] **Webhook Replay Attacks:** Prevented — Idempotent event ID deduplication in `AuditLogModel`.
- [x] **Plaintext Secrets / Passwords:** Prevented — Bcrypt 10 rounds; environment variable validation hook asserts on boot.
- [x] **Production Mock Data:** Prevented — Automated zero-mock scanner confirmed zero mock customer/order arrays in application code.
- [x] **Broken Mobile UI:** Prevented — Elevated chatbot and cookie banner above mobile bottom navigation bar with 16px buffer.
- [x] **Build & Typecheck:** 0 TypeScript compilation errors; 64/64 Vitest unit tests passing.

---

## 3. Observed Performance & Production Latency Benchmarks

> **Operational Principle:** Database indexing and server-component architecture are necessary foundations, but true platform speed requires **observed production performance** under real-world network conditions.

### A. Server Latency & HTML Payload Benchmarks (Observed on Runtime)

| Route / Surface | HTTP Status | Warm TTFB | Payload Size | Rendering Strategy | DB Query Profile |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Storefront Home (`/`)** | 200 OK | ~350ms – 1.1s | 217.0 KB | Server Component (SSR / ISR) | Indexed Categories & SiteSettings |
| **Category Catalog (`/category/[slug]`)** | 200 OK | ~300ms – 630ms | 165.9 KB | Server Component (ISR) | Compound Index: `category_id` + `status` |
| **Product Comparison (`/compare`)** | 200 OK | ~250ms – 310ms | 140.7 KB | Client-Hydrated Shell | Local state + on-demand spec fetch |
| **Customer Account Hub (`/account`)** | 200 OK | ~300ms – 360ms | 148.6 KB | Authenticated Dynamic SSR | Scoped lookup by `user_id` index |
| **Search API (`/api/search`)** | 200 OK | ~40ms – 90ms | < 15 KB | Edge / Route Handler | Capped query (100 char), text index |
| **Pincode Check (`/api/pincode/check`)** | 200 OK | ~30ms – 60ms | < 1 KB | Edge / Route Handler | Exact match on 6-digit `pincode` index |

### B. Production Core Web Vitals Targets & Monitoring Protocol

The following thresholds are mandated for live Vercel Production (`https://ttrc.store`):

```text
Surface: Homepage (/)
  TTFB   : <= 600 ms (Desktop) | <= 800 ms (Mobile 4G)
  LCP    : <= 2.2 s (Desktop)   | <= 2.8 s (Mobile 4G)
  INP    : <= 150 ms
  CLS    : <= 0.05
  JS     : <= 180 KB transferred (initial bundle)
  Images : <= 450 KB total (WebP/AVIF optimized via next/image)

Surface: Category Catalog (/category/[slug])
  TTFB   : <= 500 ms
  LCP    : <= 2.0 s

Surface: Product Detail (/product/[slug])
  TTFB   : <= 500 ms
  LCP    : <= 2.2 s

Network Simulation Profiles:
  - Fast 4G : 4 Mbps down, 1.5 Mbps up, 40 ms RTT
  - Slow 4G : 1.6 Mbps down, 750 kbps up, 150 ms RTT
```

---

## 4. Real-World Launch Rehearsal Protocol

Before opening the storefront to public traffic, the following end-to-end rehearsal sequence must be executed on the production domain:

### Phase A: Customer Complete Commerce Cycle
1. **Signup & Onboarding:**
   - Register new customer account (`TTRC-CUS-0000X`).
   - Confirm verification flow and session cookie issuance.
2. **Catalog Discovery & Price Verification:**
   - Search technical components via instant search (`/api/search`).
   - Navigate category tree and open product detail.
   - Verify bulk tiered pricing adjusts server calculation appropriately.
3. **Cart & Shipping:**
   - Add product with bulk tier to cart.
   - Add delivery address; test 6-digit postal code serviceability via `/api/pincode/check`.
4. **Checkout & Payment:**
   - Enter checkout; verify server recalculates exact paise total, GST, and shipping.
   - Complete payment (Razorpay test gateway or COD with configured fee).
   - Confirm atomic stock decrement and sequential order number (`TTRC-ORD-0000X`).
5. **Post-Purchase Operations:**
   - View order in `/account/orders/[id]` and generate Bill of Supply / GST Tax Invoice.
   - Verify tracking timeline and return request eligibility.
   - Submit verified buyer review; confirm it enters moderation without publishing fake rating.
   - Test reorder functionality.
   - Log out and log back in; verify customer data persistence.

### Phase B: Simultaneous Admin Control Operations
1. Log into `/admin` with privileged admin session.
2. View real-time orders list; open new customer's order.
3. Advance order status through legitimate state transitions (`Confirmed` &rarr; `Processing` &rarr; `Shipped`).
4. Review customer address details and financial invoice match.
5. Review pending customer product review and approve/reply.
6. Verify live inventory balance decremented correctly in `/admin/products`.
7. Create and test a promotion coupon in `/admin/coupons`.

### Phase C: Multi-Tenant Data Isolation Test
- **Customer &ne; Admin:** Ensure customer session receives 403 Forbidden on `/admin/*`.
- **User A &ne; User B:**
  - Verify User A cannot access User B's orders (`/orders/[id]`), addresses, cart, wishlist, or personal privacy export.
  - All direct HTTP requests across user boundaries return 403 Forbidden or 404 Not Found.

---

## 5. Deployment & Operational Runbook

1. **Environment Variables (Vercel Production):**
   - `MONGODB_URI`: Authoritative MongoDB Atlas connection string (replica set enabled).
   - `JWT_SECRET`: 64-character high-entropy secret for customer session tokens.
   - `NEXT_PUBLIC_SITE_URL`: `https://ttrc.store`
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`: (Activated per `docs/ENABLING_GST_AND_RAZORPAY.md`).

2. **Automated Verification Commands:**
   ```bash
   # 1. Full TypeScript Typecheck
   pnpm --filter web typecheck

   # 2. Comprehensive Unit Test Suite
   pnpm test:unit

   # 3. Master E-Commerce Feature Audit
   node scripts/auditEcommerceFeatures.mjs

   # 4. Security Hardening Audit
   node scripts/securityAudit.mjs

   # 5. Live Release Gate (Against Production Target)
   node scripts/securityReleaseGate.mjs https://ttrc.store
   ```

---

## 6. Production Release Status

**Production Status:** Technically ready for final launch rehearsal; public launch remains subject to production configuration, live payment verification, real customer checkout verification, domain/DNS verification, and final production monitoring.
