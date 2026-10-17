# TTRC Store — Back-in-Stock Alerts Implementation Report

**Release**: Next Release (Customer Experience Improvements)  
**Authoritative Database**: MongoDB Atlas (`ttrc_store`)  
**Status**: Implemented, Verified, Zero Synthetic Data  

---

## 1. Executive Summary

Robotics kits, specialized microcontrollers, high-discharge LiPo batteries, and motor drivers frequently experience supply chain lead times. When a high-demand item is temporarily out of stock, losing interested customers reduces conversion and damages store retention.

We have engineered an enterprise Back-in-Stock notification system designed specifically around Indian robotics customer requirements, complying with email privacy standards and protecting server resources.

---

## 2. Subscription Schema & Audit Model

In [models.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/models.ts), the `StockSubscriptionModel` tracks alert registrations:

```typescript
export interface IStockSubscription {
  _id?: string;
  product_id: string;
  variant_id?: string;
  sku: string;
  email: string;
  user_id?: string;
  status: 'active' | 'notified' | 'cancelled' | 'unsubscribed';
  unsubscribe_token: string;
  notified_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### Database Indices & Deduplication
- Compound Index: `{ product_id: 1, email: 1, status: 1 }`
- Token Index: `{ unsubscribe_token: 1 }`
- Ensures O(1) duplicate checks and instantaneous token lookups during 1-click unsubscribe actions.

---

## 3. Registration Flow & Anti-Abuse Controls

Implemented in [stock-subscriptions.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/stock-subscriptions.ts):

1. **Email Normalization**: Trimmed and converted to lowercase before parsing and database matching, preventing duplicate entries like `Student@RobotClub.org` vs `student@robotclub.org`.
2. **Rate Limiting**: Enforces a strict sliding limit of 5 subscription attempts per minute per email via [rate-limiter.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/security/rate-limiter.ts).
3. **Availability Verification**: If a product has `stock_quantity > 0`, the system rejects the alert registration and notifies the customer immediately: *"This product is currently in stock! You can add it to your cart right now."*
4. **Duplicate Prevention**: If an active subscription already exists for `{ product_id, email, status: 'active' }`, the customer receives a reassuring confirmation without creating duplicate database rows: *"You are already registered for alerts on this item. We will email you the moment stock arrives!"*
5. **Secure Unsubscribe Token**: Each subscription is assigned a cryptographically random 24-byte hex token (`crypto.randomBytes(24).toString('hex')`).

---

## 4. Restock Event Triggers & Dispatch Pipeline

### Real Restock Transitions Only
In [admin.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/admin.ts) (`updateProductAction`):
- When an administrator modifies a product, the previous inventory level is inspected.
- The notification trigger fires **only** on genuine stock transitions:
  ```typescript
  if (previousStock <= 0 && newStock > 0) {
    notifySubscribersOnRestock(
      productId,
      existingProduct.name,
      existingProduct.slug,
      existingProduct.selling_price_paise
    ).catch(console.error);
  }
  ```
- Routine stock edits on already-in-stock items (e.g. 50 -> 60) do not trigger dispatches.

### Atomic Notification Status Transitions
To prevent duplicate emails during high-concurrency restock updates:
```typescript
const updated = await StockSubscriptionModel.findOneAndUpdate(
  { _id: sub._id, status: 'active' },
  { $set: { status: 'notified', notified_at: new Date() } }
);
```
Only if the atomic transition from `active` to `notified` succeeds is the email dispatched via Resend.

---

## 5. Transactional Email & 1-Click Unsubscribe

In [resend.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/resend.ts), `sendBackInStockEmail` formats an email matching the TTRC brand aesthetic:
- Clear product title and price in INR (₹).
- Direct "Order Now" action button taking the customer straight to the product page.
- Direct "Unsubscribe from back-in-stock alerts for this item" link pointing to `/api/stock-subscriptions/unsubscribe?token=...`.
- [route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/stock-subscriptions/unsubscribe/route.ts) provides a single-click unsubscribe endpoint returning an accessible confirmation page without requiring login or passwords.

---

## 6. Storefront Customer Experience

In [product-order-box.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/store/product-order-box.tsx):
- When `stockQty <= 0`, the Add to Cart and Buy Now buttons are gracefully replaced with the **"Notify Me When Available"** card.
- Authenticated customers have their registered email pre-filled.
- Inline status messages provide instant visual feedback on submission without page reloads.
