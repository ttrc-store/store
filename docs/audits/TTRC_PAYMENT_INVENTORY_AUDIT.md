# TTRC Store — Payment Integrity & Inventory Concurrency Audit

**Platform**: TTRC Store (`https://www.ttrc.store/`)  
**Scope**: Razorpay Standard Integration, Webhook Lifecycle, Inventory State Machine  
**Audit Date**: October 16, 2026  
**Status**: 100% Passed (31 Payment & Concurrency Unit Tests)  

---

## 1. Authoritative Payment Lifecycle State Machine

The order and payment state machine enforces strict linear transitions:

```
[Customer Checkout]
       │
       ▼ (Atomic stock reservation via $gte check)
   `pending` (payment_status: `pending`)
       │
       ├─── [Payment Failure / Browser Cancel] ──► `cancelled` (payment_status: `failed`)
       │                                            │ (Stock released atomically via $inc)
       │
       ├─── [30-Min Inactivity Timeout] ─────────► `cancelled` (payment_status: `failed`)
       │                                            │ (Stock released via cleanup task)
       │
       └─── [Razorpay Captured / Verified] ─────► `processing` (payment_status: `paid`)
                                                    │ (Bill number generated, stock consumed)
                                                    ▼
                                                `shipped` ──► `delivered`
```

### Prohibited State Transitions (Hardened & Enforced)
- `processing` / `delivered` $\rightarrow$ `cancelled` via payment webhook (Prohibited: out-of-order `payment.failed` is ignored).
- `pending` $\rightarrow$ `paid` without cryptographic HMAC verification & server amount match (Prohibited: rejected with 400).
- `paid` order $\rightarrow$ second `payment.captured` event creating second invoice (Prohibited: skipped via idempotency check).

---

## 2. Razorpay Webhook Security & Idempotency Architecture

In [route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/webhooks/razorpay/route.ts):

### 2.1 Cryptographic Signature Verification
```typescript
const signature = req.headers.get('x-razorpay-signature');
const rawBody = await req.text(); // Raw unmodified body
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

### 2.2 Replay Protection via Durable Audit Logging
Before processing any webhook event, the database is queried for `event_id`:
```typescript
const existingLog = await AuditLogModel.findOne({
  action: `webhook.razorpay.${event}`,
  'metadata.eventId': eventId,
});

if (existingLog) {
  console.log(`[Razorpay Webhook] Event ${eventId} already processed (idempotent skip).`);
  return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
}
```

### 2.3 Out-of-Order Webhook Protection
When a `payment.failed` event arrives, it uses an atomic query targeting strictly pending orders:
```typescript
const order = await OrderModel.findOneAndUpdate(
  {
    $or: [
      { razorpay_order_id: razorpayOrderId },
      { order_number: razorpayOrderId },
      { _id: razorpayOrderId },
    ],
    status: 'pending',
    payment_status: 'pending',
  },
  {
    $set: {
      status: 'cancelled',
      payment_status: 'failed',
    },
  },
  { new: false }
);

if (!order) {
  console.log(`[Razorpay Webhook] Payment failed for ${razorpayOrderId}, but order not pending. Ignoring restock.`);
  return NextResponse.json({ received: true, note: 'Order not in pending state' }, { status: 200 });
}
```

---

## 3. Inventory Reservation & Race Condition Invariants

| Invariant | Implementation Mechanism | Verified Result |
| :--- | :--- | :---: |
| **Never Negative Inventory** | Conditional decrement: `ProductModel.findOneAndUpdate({ _id: id, stock_quantity: { $gte: qty }, is_active: true }, { $inc: { stock_quantity: -qty } })` | **PASS** |
| **Atomic Rollback on Partial Failures** | If item $N$ fails stock check, items $1 \dots N-1$ are restored immediately via `$inc: { stock_quantity: +qty }`. | **PASS** |
| **Single Restock on Multiple Failures** | Atomic transition to `cancelled` matches exactly once; duplicate webhook deliveries match 0 documents. | **PASS** |
| **Late Failure Cannot Cancel Paid Order** | Query filter enforces `status: 'pending', payment_status: 'pending'`. A paid order (`status: 'processing'`) is never touched. | **PASS** |
| **Safe Order Reuse on Retry** | `existingPendingOrderId` validates ownership and reuses the existing reservation without double deduction. | **PASS** |
| **Abandoned Reservation Reclamation** | `cleanupExpiredPendingOrdersAction` reclaims inventory for reservations older than 30 minutes. | **PASS** |

---

## 4. Concurrency Scenarios & Test Evidence

All scenarios verified in `tests/security/next-release-features.test.ts`, `tests/security/customer-experience-improvements.test.ts`, and `tests/security/razorpay-production-security.test.ts`:

1. **Delayed `payment.failed` Webhook**: An order already verified and marked `processing` receives a delayed failure event $\rightarrow$ Webhook logs skip, order remains `processing`, inventory is not falsely doubled.
2. **Duplicate `payment.failed` Webhook Replays**: Two identical failure events arrive simultaneously $\rightarrow$ Event 1 marks order cancelled and restocks; Event 2 matches 0 pending records and exits cleanly.
3. **Pending Order Release**: Customer cancels checkout modal $\rightarrow$ `releasePendingOrderAction` atomically cancels order and credits inventory back.
4. **Authoritative Price Enforcement**: Client attempts to create an order with `amount: 100` (₹1) for a ₹3,199 product $\rightarrow$ Server queries MongoDB price, overwriting client payload, creating a Razorpay order for ₹3,199.
5. **Amount Verification on Capture**: Customer attempts to pay ₹1 for a ₹5,000 order $\rightarrow$ `/api/verify-payment` detects `payment.amount !== order.total` and rejects capture with HTTP 400.
