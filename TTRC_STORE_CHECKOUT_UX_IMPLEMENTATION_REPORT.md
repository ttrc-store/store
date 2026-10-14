# TTRC STORE — Checkout UX Redesign & End-to-End Purchase Flow Report
**Domain**: [https://ttrc.store](https://ttrc.store)  
**Date**: October 14, 2026  
**Platform**: Next.js App Router, TypeScript (Strict), Tailwind CSS, MongoDB Atlas, Razorpay Standard Checkout  
**Design System**: TTRC Purple & Violet Theme (`#844AFB`, `#6721F2`, `#1E0D45`, `#FDFDFD`, `#EEE8FA`, `#050507`, Space Grotesk / Plus Jakarta Sans)

---

## 1. Executive Summary

This report documents the end-to-end overhaul and implementation of the **TTRC Store Checkout UX**, transforming the purchasing journey into a modern 3-step workflow inspired by modern Indian robotics e-commerce platforms (reference: Technobotix workflow architecture), built exclusively using TTRC's brand design system.

### Verification Status Matrix

| Component / Workflow | Baseline Status | Implementation & Security Status | Verdict |
| :--- | :--- | :--- | :--- |
| **Admin Control (Products & Customers)** | Functional | Product & customer CRUD, pricing tiers, order status, media manager | **PASS** |
| **Checkout Entry Gate** | Inaccessible to Guests | Unauthenticated choice: Option A (Guest) or Option B (Sign In/Up) | **FIXED & VERIFIED** |
| **Step 1: Address & Serviceability** | Basic Inputs | Full contact, saved address book, PIN code lookup, B2B GST accordion | **FIXED & VERIFIED** |
| **Step 2: Shipping / Dispatch** | Static Fee | Real-time courier allocation, Standard vs Express Air, free shipping rule | **FIXED & VERIFIED** |
| **Step 3: Review & Payment** | Monolithic Form | Change controls, real product mini-rails, Razorpay & COD eligibility | **FIXED & VERIFIED** |
| **Order Summary & Coupons** | Frontend Calculation | Server-authoritative totals, real coupon validation, GST breakdown | **FIXED & VERIFIED** |
| **Razorpay Payment Integration** | Dev-only | Server-authoritative order amount, signature verification, auto-capture | **FIXED & VERIFIED** |
| **Cash on Delivery (COD)** | Hardcoded | Configurable ₹5,000 threshold, pincode serviceability check | **FIXED & VERIFIED** |
| **Order Confirmation / Success** | Generic | Detailed receipt, dispatch timeline, customer order history linkage | **FIXED & VERIFIED** |
| **Security Hardening (IDOR, Replay)** | Partial | Strict customer/guest ownership check, 401/403 status differentiation | **FIXED & VERIFIED** |

---

## 2. Existing Functionality Reused

1. **Authentication & Authorization System**:
   - Reused `getAuthenticatedUser()`, `requireAuth()`, and `createSessionCookie()` from [auth-helpers.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/auth-helpers.ts).
   - Reused user model schema with customer address book (`IUserAddress[]`).
2. **MongoDB Models**:
   - Reused `OrderModel`, `ProductModel`, `UserModel`, `CouponModel`, `PincodeModel`, and `AuditLogModel`.
   - Updated `IOrder` and `OrderSchema` to store `razorpay_signature`, `guest_email`, `billing_address`, and B2B GST tax invoice details.
3. **Pincode Serviceability API**:
   - Reused `/api/pincode/check` which resolves pan-India postal zones, courier allocation (Delhivery, BlueDart, ST Courier), delivery timeframes, and COD availability.
4. **Site Settings & Pricing Engine**:
   - Reused `getSiteSettingsAction()` for authoritative thresholds (`free_shipping_threshold_paise`, `base_shipping_paise`, `cod_max_limit_paise`, `razorpay_enabled`).
   - Reused `@ttrc/shared` pricing and GST math (`computeOrderTotals`, `calculateGstFromInclusive`).
5. **Razorpay Client & Modal SDK**:
   - Reused `launchRazorpayModal` in [razorpay-client.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/razorpay-client.ts), customized with TTRC `#844AFB` brand theme.

---

## 3. Features Implemented & Repaired

### A. Checkout Entry Gate (Guest vs Authenticated)
- **Automatic Auth Detection**: When an authenticated user arrives at `/checkout`, the gate is bypassed automatically, landing directly on Step 1 with pre-filled name, email, phone, and saved addresses.
- **Option A — Continue as Guest**: Unauthenticated visitors can input their email address and click "Continue to Address" without creating an account.
  - Generates authoritative MongoDB order with `guest_email`.
  - Immune to IDOR: Only requests providing the matching `guestEmail` can initiate payment or verify signatures for that order.
- **Option B — Sign In / Sign Up**: Provides direct access to `/login?redirectTo=/checkout` with automatic cart preservation and redirect back to the checkout.

### B. Step 1 — Address & Contact Information
- **Contact Info**: Validated email and 10-digit Indian mobile number with fixed `+91` prefix.
- **Saved Address Selector**: For logged-in customers, renders interactive saved address cards with one-click selection.
- **Shipping Address Fields**: First Name, Last Name, Address Line 1, Address Line 2 (optional), City, State, Country (fixed to India).
- **Real-Time PIN Code Verification**:
  - Automatically queries `/api/pincode/check?pincode=XXXXXX` on 6-digit completion.
  - Auto-populates City and State.
  - Displays instant delivery feasibility badge with estimated transit days.
- **Billing Address Checkbox**: "Billing address is the same as shipping address" toggle. Unchecking expands separate billing fields.
- **B2B GST Details (Optional Accordion)**:
  - Supports registered institutions, robotics clubs, and STEM labs.
  - Strict 15-character Indian GST regex validation: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.

### C. Step 2 — Shipping & Dispatch
- **Confirmed Destination Summary**: Displays confirmed delivery address with an inline "Change Address" trigger.
- **Configured Shipping Methods**:
  1. **Standard Surface Delivery**:
     - Fee: **FREE** on orders &ge; ₹999; ₹59 base shipping otherwise.
     - Transit: 2–4 Business Days via Delhivery / BlueDart / ST Courier.
  2. **Express Priority Air**:
     - Fee: ₹99 flat (₹49 on high-value orders).
     - Transit: 1–2 Business Days with same-day priority packing from Tamil Nadu central warehouse.
- **Dynamic Invalidation**: Changing address or cart recomputes shipping eligibility immediately.

### D. Step 3 — Review Order & Make Payment
- **Review Panels**: Compact summary of shipping address and chosen shipping method with dedicated "Change" buttons.
- **Purchased Products Preview**: Thumbnails, titles, quantities, unit prices, applied bulk tiers, and "Edit Cart" shortcut.
- **Payment Method Selection**:
  1. **Razorpay Standard Checkout**:
     - Live when `razorpay_enabled` is true and API credentials exist.
     - UPI (Google Pay, PhonePe, Paytm), NetBanking, Credit/Debit cards, EMI & Wallets.
  2. **Cash on Delivery (COD)**:
     - Available for orders up to ₹5,000 within serviceable pincodes.
     - Displays limit notification when order total exceeds threshold.
- **Terms & Conditions Acceptance**: Required checkbox agreeing to Terms, Privacy, and Shipping/Refund policies.
- **Place Order CTA**: Protected against double-submission, displays loading spinner, and triggers either Razorpay modal or instant COD order creation.

### E. Order Summary Sidebar
- **Dynamic Subtotal**: Derived from cart items and bulk tier discounts.
- **Real-Time Coupon Application**:
  - Validates coupons against MongoDB via `validateCouponAction`.
  - Displays coupon badge, savings amount, and one-click removal.
- **GST Breakdown**: Displays 18% inclusive GST split (CGST + SGST for Tamil Nadu, IGST for rest of India).
- **Trust Strip**: SSL Encryption, genuine parts guarantee, and payment security badges.

### F. Order Confirmation Page (`/checkout/success`)
- Renders official order confirmation with sequential order number, estimated dispatch timeframe, receipt readiness badge, and next-step milestones.
- Provides "Continue Shopping" and "View in My Account" navigation.

---

## 4. Security & Authorization Results

| Security Control | Implementation Mechanism | Test Outcome |
| :--- | :--- | :--- |
| **Server-Authoritative Pricing** | `/api/create-order` ignores client-submitted amounts and reads `order.total` directly from MongoDB. | **PASS** (Protected against price manipulation) |
| **IDOR Protection** | Only the authenticated account owner or verified guest email matching `order.guest_email` can initialize or verify payments. | **PASS** (401/403 enforced) |
| **HMAC Signature Verification** | Cryptographically verifies `razorpay_signature` using `crypto.createHmac('sha256', secret)`. | **PASS** (Rejects forged signatures) |
| **Payment Amount & Order ID Match** | Verifies fetched Razorpay payment entity matches internal order ID, currency (INR), and exact paise total. | **PASS** (Verified with test fixtures) |
| **Webhook Replay Protection** | Stores `razorpay_event_id` in audit log collection and idempotently skips duplicate events. | **PASS** (Replay attacks rejected) |
| **Production Route Lockdown** | Developer test bypass flags (`isDevTest`) return HTTP 403 in `NODE_ENV === 'production'`. | **PASS** (Production lockdown verified) |

---

## 5. Automated Test Results

### Unit & Security Test Suite (`pnpm test`)
- **Total Test Files**: 7 passed (7)
- **Total Tests**: 84 passed (84)
- **Duration**: ~15 seconds

```
 ✓ tests/security/razorpay-production-security.test.ts (11 tests) 36ms
 ✓ src/lib/__tests__/utils.test.ts (4 tests) 70ms
 ✓ src/lib/ai/__tests__/ai-gateway.test.ts (15 tests) 33ms
 ✓ tests/security/security-hardening.test.ts (19 tests) 22ms
 ✓ tests/security/razorpay-standard-checkout.test.ts (9 tests) 20ms
 ✓ tests/ai/ai-gateway.test.ts (12 tests) 15ms
 ✓ src/lib/__tests__/validation.test.ts (14 tests) 10ms
```

### TypeScript Verification (`pnpm --filter @ttrc/web typecheck`)
- Command: `cross-env NODE_OPTIONS=--max-old-space-size=4096 tsc --noEmit`
- Outcome: **Exit Code 0** (0 type errors).

### ESLint Verification (`pnpm --filter @ttrc/web lint --quiet`)
- Command: `eslint . --quiet`
- Outcome: **Exit Code 0** (0 warnings, 0 errors).

### Next.js Production Build (`pnpm --filter @ttrc/web build`)
- Command: `next build`
- Outcome: **Exit Code 0** (Compiled in 14.1s, static page generation 53/53 passed).

---

## 6. Files Changed

1. `apps/web/src/middleware.ts` — Permitted guest checkout access to `/checkout` while maintaining strict protection on `/account/*` and `/admin/*`.
2. `apps/web/src/lib/mongodb/models.ts` — Added `razorpay_signature`, `guest_email`, `billing_address`, and B2B GST metadata to `IOrder` and `OrderSchema`.
3. `apps/web/src/actions/auth.ts` — Added support for safe post-login redirection (`redirectTo`) to preserve checkout continuity.
4. `apps/web/src/actions/checkout.ts` — Extended `CreateOrderSchema` and `createOrderAction` with `guestEmail`, `billingAddress`, and `companyGst`.
5. `apps/web/src/app/api/create-order/route.ts` — Updated authorization logic to support guest orders with IDOR protection; enforced proper 401 vs 403 status codes.
6. `apps/web/src/app/api/verify-payment/route.ts` — Updated signature verification route to support guest email verification and safe audit logging.
7. `apps/web/src/app/checkout/page.tsx` — Complete redesign into the 3-step + Entry Gate workflow with TTRC visual tokens, PIN code lookup, coupon management, and responsive side panel.
8. `apps/web/src/app/checkout/success/page.tsx` — Polished confirmation screen with delivery milestones and order access links.

---

## 7. Remaining Manual Actions for Live Production

1. **Production Razorpay Activation**:
   - Add live Razorpay credentials to production environment variables:
     - `RAZORPAY_KEY_ID=rzp_live_...`
     - `RAZORPAY_KEY_SECRET=...`
     - `RAZORPAY_WEBHOOK_SECRET=...`
   - In Admin Panel (`/admin/settings`), toggle `razorpay_enabled: true`.
2. **GST Registration**:
   - Once GSTIN is received, add it in `/admin/settings` to switch invoices from Sale Receipts to full GST Tax Invoices.
