# TTRC Store — Customer Experience Gap Audit

**Date:** October 16, 2026  
**Auditor Roles:** Senior Full-Stack Architect, Ecommerce Product Engineer, UX Engineer, Security Engineer, QA Lead  
**Scope:** Customer journey from product discovery to purchase, checkout, payment recovery, and post-purchase support across the TTRC Store platform.  
**Tech Stack Baseline:** Next.js 16 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, Razorpay Standard Checkout (COD strictly disabled).

---

## 1. Feature Classification Matrix

| # | Customer Journey Feature | Status | Evidence & Actual Workspace Implementation |
|---|---------------------------|--------|---------------------------------------------|
| 1 | **Product Search, Typo Tolerance, Filters & Sorting** | `EXISTS BUT INCOMPLETE` | [catalog.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/catalog.ts#L592-L623) regex search matches name, SKU, slug, short description, and brand. Lacks phonetic/fuzzy typo tolerance (e.g., "arduinno") and does not index `technical_specs` attributes. |
| 2 | **Product Specifications, Variants, Manuals & In-Box Content** | `EXISTS BUT INCOMPLETE` | [models.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/models.ts#L123-L148) supports `technical_specs`, `voltage`, `current`, and `attributes.configurations`. Downloadable PDF manuals, wiring schematics, and structured in-box checklists were previously missing. |
| 3 | **Component Compatibility Validation** | `EXISTS AND VERIFIED` *(Enhanced)* | [models.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/models.ts#L248-L258) has `ProductCompatibilityModel`. Enhanced with interactive [product-compatibility-checker.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/store/product-compatibility-checker.tsx) testing voltage, logic levels (3.3V vs 5V), and external power guidance for microcontrollers (Arduino, ESP32, Raspberry Pi Pico, STM32). |
| 4 | **Project-Based Robotics Kits & Bundles** | `EXISTS AND VERIFIED` *(Fixed)* | [product/[slug]/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/product/%5Bslug%5D/page.tsx) previously contained a static server button with zero click functionality. Fixed with client component [product-bundle-box.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/store/product-bundle-box.tsx), enabling 1-click cart addition of kits + verified spare parts with live bundle calculation. |
| 5 | **Guest Cart Persistence & Cart Merging** | `EXISTS BUT INCOMPLETE` | [use-cart.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/store/use-cart.ts) provides persistent browser storage via Zustand `persist` (`ttrc-cart`). Seamless for guests across reloads; backend cross-device cloud sync for authenticated sessions is marked for future roadmap. |
| 6 | **Checkout Recovery & Safe Payment Retries** | `EXISTS AND VERIFIED` *(Fixed)* | [checkout.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts) previously suffered from stock leaks where abandoned/dismissed Razorpay modals locked stock permanently and repeated attempts created duplicate orders. Fixed with `existingPendingOrderId` reuse and `releasePendingOrderAction`. |
| 7 | **Stock Availability & Back-in-Stock Alerts** | `MISSING` | Out-of-stock items disable ordering and show "Out of Stock" badges, but email subscription notifications for restock are not yet implemented. |
| 8 | **Order Tracking & Proactive Updates** | `EXISTS AND VERIFIED` *(Fixed)* | [orders/[id]/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/orders/%5Bid%5D/page.tsx) previously forced unauthenticated guests to login. Fixed with [getGuestOrderAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts#L195-L285), enabling guests to track orders via order number + email/phone with direct courier tracking links. |
| 9 | **Warranty, Returns & Support Requests** | `EXISTS AND VERIFIED` | [orders.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts#L839-L908) has `requestReturnAction` enforcing a 7-day post-delivery replacement window with audit log creation and admin notification. |
| 10 | **Verified Purchase Reviews** | `EXISTS AND VERIFIED` | [models.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/models.ts#L456-L486) `ReviewModel` with `is_verified_purchase`, status moderation (`pending`/`approved`), and [submitProductReviewAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/account.ts#L365-L440) strictly verifying delivered orders. |
| 11 | **Recently Viewed & Reorder** | `EXISTS BUT INCOMPLETE` | [orders.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts#L710-L770) `reorderAction` allows repurchasing past orders with revalidated database prices. Local recently-viewed carousel is not yet added. |
| 12 | **Product-Specific Technical Support** | `EXISTS AND VERIFIED` *(Enhanced)* | Added direct WhatsApp technical inquiry trigger on [product-compatibility-checker.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/store/product-compatibility-checker.tsx#L68-L72) prefilling Product Name, SKU, URL, and target host controller. |
| 13 | **Mobile Accessibility & Error Recovery** | `EXISTS AND VERIFIED` | Full responsive bottom navigation, touch targets >= 44px, WCAG AA contrast, and graceful fallback states. |
| 14 | **SEO, Structured Data & Canonical URLs** | `EXISTS AND VERIFIED` | JSON-LD schema for `Product`, `BreadcrumbList`, and `FAQPage` embedded in [page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/product/%5Bslug%5D/page.tsx#L199-L213). |

---

## 2. Deep Dive: High-Priority Customer Friction Points Resolved

### A. The "Dead Bundle Button" Fix
- **Problem:** On the product detail page for robotics kits, customers were presented with a "Frequently Bought Together Bundle" displaying the kit and 2 compatible spare parts with a combined price tag. However, the button was a non-interactive Server Component tag (`<Button>Add All Items to Cart</Button>`) with no click handler. Clicking it produced zero effect.
- **Solution:** Replaced with client component [ProductBundleBox](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/store/product-bundle-box.tsx). Customers can now toggle individual bundle parts with checkboxes, see live calculated bundle totals and savings against MRP, and click "Add All Items to Cart" which batches all items into `useCartStore`, triggers visual confirmation, and opens the cart drawer.

### B. Payment Dismissal & Inventory Lock Fix
- **Problem:** When checkout began, `createOrderAction` immediately decremented `stock_quantity` by `$inc: -quantity`. If the customer closed the Razorpay popup, suffered a temporary bank OTP failure, or wanted to retry, the stock was already subtracted. A second attempt decremented stock *again*, locking out items if low stock remained, and left the first order in `status: 'pending'` permanently holding the stock hostage.
- **Solution:** 
  1. Updated [createOrderAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts) to accept `existingPendingOrderId` and safely reuse the pending reservation upon retry without duplicate deduction.
  2. Implemented [releasePendingOrderAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/checkout.ts#L401-L450) and a customer-facing "Cancel payment attempt & release reserved items" trigger in [checkout/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/checkout/page.tsx).
  3. Updated [razorpay/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/webhooks/razorpay/route.ts#L106-L130) to automatically restock inventory when Razorpay sends `payment.failed`.

### C. Guest Order Tracking & BSON CastError Fix
- **Problem:** 
  1. [orders/[id]/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/orders/%5Bid%5D/page.tsx) unconditionally executed `redirect('/login?redirectTo=/account/orders')` if the user was unauthenticated, completely blocking guest customers from tracking orders dispatched to them.
  2. `getMyOrderAction` queried `OrderModel.findOne({ _id: orderId })`. When human order numbers (e.g., `ORD-2026-0001`) were supplied in the URL, Mongoose threw a CastError resulting in a 404.
- **Solution:** 
  1. Updated `getMyOrderAction` to safely handle both 24-char hex ObjectIds and human `order_number` strings via regex detection.
  2. Created [getGuestOrderAction](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts#L195-L285) to verify guest identity via order number + email/phone number.
  3. Replaced the forced login redirect with a secure guest verification form and direct courier tracking links.
