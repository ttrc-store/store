# TTRC Store — Monitoring, Observability & Incident Recovery Runbook

**Platform**: TTRC Store (`https://www.ttrc.store/`)  
**Scope**: Production Monitoring, Error Logging, Incident Mitigation Protocols  
**Date**: October 16, 2026  
**Audience**: On-Call Engineers & System Administrators  

---

## 1. Monitoring & Observability Baseline

### 1.1 Real-Time Telemetry
- **Vercel Analytics & Speed Insights**: Active on production (`https://va.vercel-scripts.com`, `https://vitals.vercel-insights.com`) tracking Real User Monitoring (RUM), First Contentful Paint (FCP), and Cumulative Layout Shift (CLS).
- **Edge Request Logs**: Vercel runtime logs capture all edge invocations with request ID, status codes, latency, and cache hits/misses.
- **MongoDB Atlas Metrics**: Query execution time, connection pool utilization, read/write IOPS, and memory pressure tracked via Atlas console.

### 1.2 Structured Logging Standards
All critical e-commerce server actions emit structured logs with masked sensitive data:
- `[create-order]`: Emits internal order ID, Razorpay order ID, and amount.
- `[verify-payment]`: Emits verification method, order number, and payment ID (CVV/Card details are never logged).
- `[Razorpay Webhook]`: Emits event name, event ID, order number, and restock actions.
- `[Stock Alert]`: Emits subscriber count, product ID, and notification status.

---

## 2. Critical Incident Response Protocols

### Protocol INC-1: Razorpay Payment Mismatch (Paid on Gateway, Not Marked in DB)

**Symptom**: Customer reports money deducted from UPI/card, but order remains in `pending` status or shows unpaid.

**Diagnostic Steps**:
1. Search Razorpay Dashboard for the customer's payment ID or email.
2. Confirm the payment status is `captured` and note the `order_id` and `amount`.
3. Check MongoDB `orders` collection for the order record matching `order_number` or `razorpay_order_id`.
4. Check `audit_logs` for any failed webhook delivery:
   ```json
   { "action": "webhook.razorpay.payment.captured", "metadata.orderNumber": "ORD-2026-XXXX" }
   ```

**Resolution**:
1. Run authoritative reconciliation via internal admin command or call `/api/verify-payment` with server-role credentials.
2. If the payment was captured on Razorpay for the exact order total:
   - Update order status: `{ status: 'processing', payment_status: 'paid', razorpay_payment_id: '<ID>' }`.
   - Allocate Bill Number if missing (`generateBillNumber()`).
   - Trigger Resend confirmation email manually.

---

### Protocol INC-2: Stuck Pending Orders & Inventory Reservations

**Symptom**: High volume of orders stuck in `pending` status, tying up limited robotics kit inventory.

**Diagnostic Steps**:
1. Query MongoDB for pending orders older than 30 minutes:
   ```javascript
   db.orders.find({
     status: 'pending',
     payment_status: 'pending',
     created_at: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
   }).count();
   ```

**Resolution**:
1. Trigger the automated cleanup action:
   - Call `cleanupExpiredPendingOrdersAction(30)` via administrative task.
   - The action atomically cancels expired pending orders and restores `stock_quantity` for all reserved items.
2. Review checkout funnel analytics to identify if customers experienced payment gateway abandonment or high UPI failure rates.

---

### Protocol INC-3: Inventory Discrepancy (Oversold or Ghost Stock)

**Symptom**: Inventory level in MongoDB does not match physical stock count in the warehouse.

**Diagnostic Steps**:
1. Query `audit_logs` for all actions on the product ID:
   ```javascript
   db.audit_logs.find({ "entity_id": "<PRODUCT_ID>" }).sort({ created_at: -1 });
   ```
2. Reconcile total units sold across `orders` where `payment_status: 'paid'` against historical stock additions.

**Resolution**:
1. Correct the inventory via Admin Panel > Products > Edit Product > Section 3: Pricing & Inventory.
2. Setting stock quantity from 0 to positive will automatically trigger `notifySubscribersOnRestock` for any registered back-in-stock alert subscribers.
3. If an item was accidentally oversold due to manual override:
   - Contact affected customers immediately.
   - Offer priority backorder dispatch or immediate full refund via Razorpay Dashboard.

---

### Protocol INC-4: MongoDB Atlas Connection Outage

**Symptom**: Frontend displays *"Database connection timeout"* or 500 errors across catalog and checkout.

**Diagnostic Steps**:
1. Check MongoDB Atlas Status Page (`https://status.mongodb.com/`).
2. Inspect Vercel function logs for `MongooseServerSelectionError` or IP whitelist rejections.

**Resolution**:
1. In MongoDB Atlas > Network Access, verify that Network Access allows `0.0.0.0/0` (standard for dynamic serverless edge lambdas) or dedicated NAT gateways.
2. Verify database connection string in Vercel environment variables has `retryWrites=true&w=majority&maxPoolSize=10`.
3. If Atlas cluster is undergoing automatic maintenance, Next.js serverless functions will automatically reconnect on the next invocation due to persistent client connection pooling.

---

### Protocol INC-5: Resend Transactional Email Outage

**Symptom**: Customers not receiving order confirmation or restock notification emails.

**Diagnostic Steps**:
1. Check Resend Status (`https://status.resend.com/`).
2. Check Resend Dashboard > Logs for bounced emails or API rate limit triggers (429).

**Resolution**:
1. The checkout and order creation flows are non-blocking: email failures are logged but **never** abort an order or reverse a payment.
2. Once Resend services recover, query `orders` where `confirmation_email_sent !== true` and re-trigger dispatch via admin utility.
3. For back-in-stock alerts, subscriptions that failed to send remain in `active` status and can be re-dispatched safely.
