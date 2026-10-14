# TTRC Store — Razorpay-Only Checkout & Dispatch Verification Report

**Date:** October 14, 2026  
**Application:** TTRC Store (Tamizh Tech Robotics Company)  
**Primary Domain:** [https://ttrc.store/](https://ttrc.store/)  
**Framework:** Next.js App Router + TypeScript Strict Mode  
**Database:** MongoDB Atlas  
**Payment Integration:** Razorpay Standard Web Checkout (Online Payment Only)  
**Assessment:** **TEST MODE VALIDATED — CONDITIONAL GO FOR CONTROLLED SANDBOX; LIVE ACTIVATION PENDING MERCHANT ONBOARDING & LIVE CREDENTIALS**

---

## Executive Summary

1. **Cash on Delivery (COD) Permanently Removed:**
   - COD has been removed from customer-facing checkout choices, payment badges, fee calculations, and marketing copy.
   - Server-side order creation strictly enforces online payments (`paymentMethod: 'razorpay'`), returning an explicit rejection if any client attempts to submit `paymentMethod: 'cod'`.
   - The platform never silently falls back to COD. When Razorpay keys are absent or disabled, checkout presents a clear maintenance notification and disables order confirmation.
   - Historical COD records (if any in MongoDB) remain intact for accurate accounting and order history.

2. **"Dispatch Within 10 Days" Everywhere:**
   - Prominently integrated across all storefront touchpoints: homepage hero micro-strip, trust badge strips, product page guarantee badges, FAQ, pincode serviceability checker, shipping policy, terms of service, checkout Step 2 shipping method selector, and post-checkout order confirmation screen.

3. **Honest Razorpay Mode Detection:**
   - **Current Detected Mode:** **Test Mode** (`rzp_test_...` key active in workspace environment).
   - **Live Production Status:** **NOT YET VERIFIED WITH REAL MONEY**. Live credentials (`rzp_live_...`) and production webhook configuration remain pending merchant onboarding with Razorpay.
   - **Operational Rule:** Test mode transactions must never be treated as real production revenue or fulfillment authorization.

---

## 1. Audit of Payment Configuration & Changes Made

### 1.1 Customer UI & Checkout Experience
| Area | Prior Implementation | New Razorpay-Only Implementation |
|---|---|---|
| **Payment Choices** | Radio buttons toggling between Razorpay and Cash on Delivery | Single, verified Razorpay Standard Checkout selection with UPI, Cards, NetBanking, and EMI badges. No COD option rendered. |
| **COD Fees & Limits** | `codMaxLimitPaise`, COD fee adjustments, limit alerts | Removed completely from state, calculations, and UI. |
| **Gateway Offline State** | Silent fallback or generic alert | Clean warning banner: *"Online Payment Temporarily Unavailable. Razorpay gateway configuration is being verified. Please contact support@ttrc.store or try again later. Cash on Delivery is not offered on TTRC Store."* Checkout CTA is disabled. |
| **Footer Badges** | Displayed COD badge | Replaced with Razorpay Standard Checkout badge alongside UPI, RuPay, Visa, Mastercard, NetBanking. |
| **Order Confirmation** | Mentioned "Cash on Delivery Confirmed" | Updated to *"Payment Verified • Dispatch Within 10 Days"* with automated tracking updates. |

### 1.2 Server-Side Enforcement (`apps/web/src/actions/checkout.ts`)
- **Schema Validation:** `CreateOrderSchema` defaults `paymentMethod` to `'razorpay'`.
- **Strict Authority Check:**
  ```typescript
  if (paymentMethod !== 'razorpay') {
    return {
      error: 'Cash on Delivery is not offered on TTRC Store. Please pay securely online using Razorpay (UPI, Google Pay, Cards, NetBanking).',
    };
  }
  ```
- **Authoritative Totals:** Item subtotals and shipping costs are calculated on the server from database products. No client price, total, or payment method override is accepted.
- **Initial Status:** New orders are saved with `payment_method: 'razorpay'`, `payment_status: 'pending'`, and `status: 'pending'`.

### 1.3 Razorpay Payment Endpoints
- **`/api/create-order`:**
  - Authenticates customer or verifies guest email ownership against the MongoDB order record.
  - Derives the payable amount directly from `order.total` in integer paise. Client-supplied amounts are ignored.
  - Prevents double-initialization via Razorpay order idempotency.
  - Development test mode (`isDevTest`) is locked down and forbidden in production (`NODE_ENV === 'production'`).
- **`/api/verify-payment`:**
  - Validates order ownership and status.
  - Timing-safe HMAC-SHA256 signature verification.
  - Verifies captured payment amount against the MongoDB order total in paise.
  - Idempotent against duplicate verification requests.
- **`/api/webhooks/razorpay`:**
  - Verifies `x-razorpay-signature` using timing-safe comparison with `RAZORPAY_WEBHOOK_SECRET`.
  - Replay protection via `AuditLogModel` deduplication on `event_id`.
  - Financial invariant validation: flags and prevents fulfillment if payment amount mismatches order total.

---

## 2. "Dispatch Within 10 Days" Ubiquity Audit

The commitment to **"Dispatch within 10 days"** has been added to every customer-facing view:

| Page / Component | Exact Location | Implementation |
|---|---|---|
| **Header / Hero Micro-Strip** | `apps/web/src/app/page.tsx` | `"Dispatched within 10 days guaranteed across India"` |
| **Homepage Trust Strip** | `apps/web/src/components/store/trust-strip.tsx` | `"Dispatch Within 10 Days • All orders dispatched within 10 days across India"` |
| **Product Detail Pages** | `apps/web/src/app/product/[slug]/page.tsx` | Guarantee badge: `"Dispatch in 10 Days"`, FAQ item: *"Orders are dispatched within 10 days from our Tamil Nadu facility"* |
| **Pincode Serviceability Checker** | `apps/web/src/components/store/pincode-checker.tsx` | Live checker result: `"Dispatch within 10 days ({estimatedDays}) via {courierName}"` |
| **Pincode Server API** | `apps/web/src/app/api/pincode/check/route.ts` | Returns `estimatedDays: "Dispatch within 10 days (2–4 business days delivery)"`, `codAvailable: false` |
| **Shipping Policy Page** | `apps/web/src/app/shipping-policy/page.tsx` | Highlight banner: `"Dispatch Within 10 Days Guarantee — Every robotics kit, sensor array, and mechanical fastener is bench-tested and packed for dispatch within 10 days of verified online payment"` |
| **Terms & Conditions** | `apps/web/src/app/terms/page.tsx` | Section 3: *"Shipping & Dispatch within India: All accepted orders are dispatched within 10 days of order confirmation"* |
| **Frequently Asked Questions** | `apps/web/src/app/faq/page.tsx` | Question: *"When will my order be dispatched?"* &bull; Answer: *"All orders are dispatched within 10 days across India"* |
| **Checkout Step 2 (Shipping)** | `apps/web/src/app/checkout/page.tsx` | Standard Surface: *"Estimated Delivery: Dispatch within 10 days (2–4 Business Days transit across India)"*; Express Air: *"Estimated Delivery: Dispatch within 10 days (1–2 Business Days priority flight transit)"* |
| **Order Success Screen** | `apps/web/src/app/checkout/success/page.tsx` | Title: `"Payment Verified • Dispatch Within 10 Days"`; Delivery box: `"Dispatched Within 10 Days"` |
| **Global Footer** | `apps/web/src/components/layout/footer.tsx` | India-Wide Delivery subtitle: `"Dispatch within 10 days"` |
| **AI Prompt Registry** | `apps/web/src/lib/ai/prompt-registry.ts` | Grounded policy: *"Delivery: India-wide delivery only. Dispatch within 10 days guaranteed across India."* |

---

## 3. Automated Validation Results

All checks were executed locally against the codebase:

```bash
# 1. Full Unit & Security Hardening Test Suite
pnpm test
✔ @ttrc/shared: 31 passed (31)
✔ @ttrc/web:    89 passed (89)
Total: 120 tests passed across 9 test files (0 failures)

# 2. TypeScript Strict Check
pnpm --filter @ttrc/web typecheck
✔ tsc --noEmit: 0 errors

# 3. Code Quality Linting
pnpm --filter @ttrc/web lint --quiet
✔ eslint: 0 warnings, 0 errors

# 4. Production Next.js Build
pnpm --filter @ttrc/web build
✔ Compiled successfully
✔ 53/53 static and server-rendered routes generated without error
```

### Key Security Tests Executed
1. `MUST strictly reject client orders attempting paymentMethod: "cod"` (**PASS**)
2. `MUST reject arbitrary unsupported payment methods and never default to COD` (**PASS**)
3. `accepts valid online order with paymentMethod: "razorpay" and marks payment_status as pending` (**PASS**)
4. `distinguishes Razorpay test mode (rzp_test_) from live mode (rzp_live_)` (**PASS**)
5. `rejects live payment claims when only test mode credentials are configured` (**PASS**)
6. `Server-authoritative order amount derivation from MongoDB` (**PASS**)
7. `REJECTS verification if Razorpay order ID does not match internal order record` (**PASS**)
8. `REJECTS verification if payment amount on Razorpay mismatches order total` (**PASS**)
9. `REJECTS webhook with invalid signature` (**PASS**)
10. `PREVENTS REPLAY ATTACKS: Skips already processed webhook eventId` (**PASS**)

---

## 4. Current Environment & Credentials Status

| Key / Variable | Environment Value | Classification | Status |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_...` | Razorpay Sandbox | **Active (Test Mode)** |
| `RAZORPAY_KEY_SECRET` | Configured | Razorpay Sandbox | **Active (Test Mode)** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_...` | Client Script Init | **Active (Test Mode)** |
| `RAZORPAY_WEBHOOK_SECRET` | Configured | Webhook Signature | **Active (Test Mode)** |
| Live Merchant Keys (`rzp_live_...`) | Not yet added | Production Gateway | **Pending Merchant Approval** |
| Production Webhook URL | `https://ttrc.store/api/webhooks/razorpay` | Production Webhook | Configured in route handler; must be registered in Razorpay Live Dashboard upon key receipt |

---

## 5. Remaining Manual Actions Before Live Customer Payments

1. **Complete Razorpay Merchant Onboarding:**
   - Complete KYC and bank verification on Razorpay Dashboard ([dashboard.razorpay.com](https://dashboard.razorpay.com)).
2. **Generate Live API Keys:**
   - Switch Razorpay Dashboard to **Live Mode**.
   - Navigate to **Account & Settings &rarr; API Keys &rarr; Generate Key**.
3. **Configure Vercel Environment Variables:**
   - Set `RAZORPAY_KEY_ID=rzp_live_...`
   - Set `RAZORPAY_KEY_SECRET=...`
   - Set `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...`
   - Set `RAZORPAY_WEBHOOK_SECRET=...`
4. **Register Live Webhook:**
   - URL: `https://ttrc.store/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
5. **Execute One Real End-to-End Live Transaction:**
   - Place a ₹1.00 live transaction using real UPI / Card.
   - Verify payment capture in MongoDB and test issuing a full refund via Razorpay Dashboard.
6. **Enable Online Payments in Admin:**
   - Toggle `razorpay_enabled: true` in `/admin/settings`.

---

## 6. Audit Verdict

- **COD Removal:** **COMPLETE & VERIFIED** (0 customer-facing COD choices, server-enforced rejection).
- **Dispatch within 10 Days:** **COMPLETE & VERIFIED** across entire storefront and checkout.
- **Razorpay Security:** **TEST MODE VALIDATED** (All 120 tests passing, timing-safe signatures, authoritative MongoDB pricing).
- **Live Payments:** **DEFERRED PENDING LIVE KEYS** (Honest reporting: sandbox transactions verified; live customer transactions cannot begin until live credentials are added).
