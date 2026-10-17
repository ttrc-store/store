# TTRC Store — Backend Business Logic Audit

**Date:** October 16, 2026  
**Auditor Roles:** Senior Full-Stack Architect, Security Engineer, QA Lead  
**Scope:** Backend invariants, database integrity, financial calculations, concurrency safety, inventory lifecycles, and authorization controls.

---

## 1. Core Invariants Verification Matrix

| Domain | Invariant / Business Rule | Enforcement Mechanism | Verified Status |
|--------|---------------------------|-----------------------|-----------------|
| **Pricing & Bulk Tiers** | Client-supplied prices and totals are NEVER trusted. Server recalculates all unit prices, bulk discount tiers, and totals from MongoDB records. | [checkout.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts#L103-L140) queries `ProductModel.find({ _id: { $in: productIds } })` and re-evaluates `bulk_price_tiers`. | `EXISTS AND VERIFIED` |
| **Inventory Concurrency** | Zero overselling under concurrent purchasing of the last available units. | Atomic Mongoose operation: `ProductModel.findOneAndUpdate({ _id, stock_quantity: { $gte: item.quantity } }, { $inc: { stock_quantity: -item.quantity } })`. Automatic rollback if subsequent cart item has insufficient stock. | `EXISTS AND VERIFIED` |
| **Stock Leak & Payment Retries** | When payment fails or checkout modal is dismissed, stock must not be permanently locked or decremented twice upon retry. | 1. Webhook `payment.failed` event restocks pending orders.<br>2. [createOrderAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts) supports `existingPendingOrderId` reuse.<br>3. [releasePendingOrderAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts) releases stock if customer cancels attempt. | `EXISTS AND VERIFIED` *(Enhanced)* |
| **Payment Gateway Integration** | Strict Razorpay Standard Checkout. Cash on Delivery is strictly prohibited. | Hardcoded rejection in [checkout.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts#L59-L63). Webhook and verify routes enforce HMAC-SHA256 timing-safe signature comparison. | `EXISTS AND VERIFIED` |
| **Financial Reconciliation** | Gateway payment amount must EXACTLY match the database order total in integer paise. | Both [verify-payment/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/verify-payment/route.ts#L215-L225) and [webhooks/razorpay/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/webhooks/razorpay/route.ts#L78-L90) fetch the payment entity directly from Razorpay and reject underpaid/overpaid transactions. | `EXISTS AND VERIFIED` |
| **Replay & Idempotency** | Duplicate webhook events or repeated client verifications must not confirm double orders or restock multiple times. | `AuditLogModel` records `webhook.razorpay.${event}` with `metadata.event_id`. Duplicate webhook requests return `{ status: 'ok', idempotent: true }` without mutation. | `EXISTS AND VERIFIED` |
| **Order Ownership & IDOR Protection** | Customers cannot create payment intents, verify payments, or view orders belonging to other customers. | [create-order/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/create-order/route.ts#L102-L130), [verify-payment/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/verify-payment/route.ts#L110-L137), and [orders.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts#L123-L142) enforce `user_id === user.id` (or matching `guest_email`). | `EXISTS AND VERIFIED` |
| **Tax (GST) & Invoicing** | Integer paise storage. Intra-state (TN 33) = CGST + SGST; Inter-state = IGST. | [shared/pricing.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/packages/shared/src/lib/pricing.ts) calculates exact CGST/SGST/IGST splits. Official sequential receipt/bill number generated via [id-generator.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/id-generator.ts). | `EXISTS AND VERIFIED` |
| **Coupon Logic & Expiry** | Expiration, minimum order value, usage limits, and rate limiting. | [checkout.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts#L146-L171) checks `expires_at > now`, `min_order_value_paise`, and increments `usage_count` atomically. | `EXISTS AND VERIFIED` |
| **Rate Limiting** | Protection against checkout spam, brute-forcing coupons, and webhook flooding. | [rate-limiter.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/security/rate-limiter.ts) enforces per-user / per-IP rate limits stored in `RateLimitModel` in MongoDB Atlas with TTL indexes. | `EXISTS AND VERIFIED` |

---

## 2. Root Cause Analysis of Resolved Backend Hazards

### Hazard 1: Inventory Leaks on Interrupted Razorpay Checkout
- **Root Cause:** Orders were created in `status: 'pending'` and inventory was decremented immediately in `createOrderAction`. When customers cancelled the Razorpay modal, closed the browser, or suffered a bank decline, neither the client nor the server restored the decremented stock. Repeated attempts generated separate orders, each deducting stock again.
- **Remediation:**
  1. Updated `apps/web/src/actions/checkout.ts` to support `existingPendingOrderId` reuse. If the user clicks "Pay with Razorpay" again after a modal dismissal, the active pending order is reused without duplicate deduction.
  2. Implemented `releasePendingOrderAction(orderId, guestEmail)` allowing customers and cleanup jobs to release stock and cancel pending orders.
  3. Added automatic stock restitution in `apps/web/src/app/api/webhooks/razorpay/route.ts` upon receiving `payment.failed`.

### Hazard 2: CastError Crash on Human Order Numbers
- **Root Cause:** [orders.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts) performed `OrderModel.findOne({ _id: orderId, user_id: auth.user.id })`. When routes or users passed human order numbers like `ORD-2026-0001` or `TTRC/25-26/100001`, Mongoose attempted to cast a non-hex string to an `ObjectId`, throwing an uncaught BSON CastError and rendering a 404 page.
- **Remediation:** Added regex verification `/^[0-9a-fA-F]{24}$/.test(orderId)` to query `_id` conditionally while querying `order_number` unconditionally.
