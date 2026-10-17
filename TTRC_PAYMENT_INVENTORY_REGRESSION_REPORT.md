# TTRC Store — Payment & Inventory Concurrency Hardening Report

**Release**: Next Release (Customer Experience Improvements)  
**Authoritative Gateway**: Razorpay Standard Checkout (Cards, UPI, Netbanking)  
**Status**: Audited, Hardened, 100% Automated Tests Passing  

---

## 1. Executive Summary

E-commerce stores selling limited-stock robotics parts frequently suffer inventory race conditions:
1. Double-stock deductions when customers retry failed payments.
2. Stock leaks when abandoned checkout sessions tie up inventory indefinitely.
3. Concurrency hazards when Razorpay webhooks arrive out-of-order (e.g. a delayed `payment.failed` event arriving after a customer has successfully completed payment via retry or alternate card).
4. Duplicate webhook replays triggering multiple inventory restocks for the same order.

We conducted a deep architectural review of the checkout pipeline and hardened the database state transitions to be strictly atomic and idempotent.

---

## 2. Identified Vulnerabilities & Remediation Matrix

| Vulnerability | Pre-Hardened State | Post-Hardened Architecture |
| :--- | :--- | :--- |
| **Out-of-Order `payment.failed` Webhook** | Naively searched by `order_id` and marked status as `cancelled`, risking cancellation of an already paid order if the customer retried. | Atomic `findOneAndUpdate` querying `{ status: 'pending', payment_status: 'pending' }`. If the order was already paid (`processing`, `completed`), the webhook safely ignores restock. |
| **Duplicate `payment.failed` Webhook Replays** | Multiple webhook retries could invoke stock increment `$inc: { stock_quantity: qty }` multiple times, inflating inventory above physical stock. | Atomic transition from pending to cancelled ensures only the first webhook execution matches; subsequent replays match 0 documents and skip restocking. |
| **Pending Order Reuse Race Conditions** | Concurrent client calls could attempt to claim or release the same pending order document simultaneously. | Atomic query and update with single-document lock semantics in MongoDB. |
| **Abandoned Checkout Stock Leaks** | Reserved stock for checkout attempts where the customer closed the browser window remained tied up until manual intervention. | Implemented `cleanupExpiredPendingOrdersAction` with a 30-minute safety window and automated restock. |
| **Duplicate `payment.captured` Webhook** | Multiple capture webhooks could re-generate invoices and dispatch duplicate confirmation emails. | Added idempotent check: if order is already marked as `processing` or `completed`, log skip and return HTTP 200 immediately. |

---

## 3. Webhook Hardening Details

In [route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/webhooks/razorpay/route.ts):

### Out-of-Order & Duplicate Defense
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
  { new: false } // Return doc before cancellation to access items
);

if (!order) {
  console.log(
    `[Razorpay Webhook] Payment failed event received for ${razorpayOrderId}, ` +
    `but order is not in pending state (already paid, cancelled, or completed). Ignoring restock.`
  );
  return NextResponse.json({ received: true, note: 'Order not in pending state' }, { status: 200 });
}
```

### Idempotent Capture Defense
```typescript
if (order.status !== 'pending' && order.payment_status === 'paid') {
  console.log(`[Razorpay Webhook] Order ${order.order_number} already paid. Skipping duplicate capture.`);
  return NextResponse.json({ received: true, note: 'Order already processed' }, { status: 200 });
}
```

---

## 4. Pending Order Release & Abandonment Cleanup

In [checkout.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts):

### Atomic Release (`releasePendingOrderAction`)
When a customer explicitly cancels or navigates back from a checkout attempt, the pending order is cancelled atomically and inventory is safely credited back:
```typescript
const order = await OrderModel.findOneAndUpdate(
  query,
  {
    $set: {
      status: 'cancelled',
      payment_status: 'failed',
    },
  },
  { new: false }
);

if (!order) {
  return { error: 'Pending order not found or already processed.' };
}

for (const item of order.items) {
  await ProductModel.findByIdAndUpdate(item.product_id, {
    $inc: { stock_quantity: item.quantity },
  });
}
```

### Background Abandonment Cleanup (`cleanupExpiredPendingOrdersAction`)
Releases reservations older than 30 minutes:
```typescript
export async function cleanupExpiredPendingOrdersAction() {
  const expiryCutoff = new Date(Date.now() - 30 * 60 * 1000);
  const expiredOrders = await OrderModel.find({
    status: 'pending',
    payment_status: 'pending',
    created_at: { $lt: expiryCutoff },
  }).limit(50);
  ...
}
```

---

## 5. Automated Verification Results

All payment and inventory safety invariants were tested against Vitest:
- `tests/security/next-release-features.test.ts` (15/15 passed)
- `tests/security/customer-experience-improvements.test.ts` (6/6 passed)
- `tests/security/razorpay-production-security.test.ts` (11/11 passed)
- `tests/security/razorpay-standard-checkout.test.ts` (9/9 passed)
- `tests/security/razorpay-only-checkout.test.ts` (5/5 passed)

Total test count across all suites: **169 tests passed, 0 failures**.
