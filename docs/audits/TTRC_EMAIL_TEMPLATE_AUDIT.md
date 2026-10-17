# TTRC Store — Transactional Email Template Audit

## 1. Executive Summary
This document provides a comprehensive audit of all transactional and customer-facing email templates in the TTRC Store (`ttrc.store`) platform. Every template has been refactored and standardized under the **Unified Ecommerce Email Theme** using responsive HTML, Space Grotesk / Plus Jakarta Sans typography, brand color tokens, an email-safe asset pipeline, and the mandatory signature block with the official TTRC logo.

---

## 2. Template Inventory & Standardization Matrix

| Template Function | Category & Priority | Purpose & Dynamic Fields | HTML Layout & Plain-Text Fallback | Security Guardrails |
|---|---|---|---|---|
| `renderOtpEmail` | P0 (Critical Security) | Email verification, password reset, email change. Fields: `otp`, `expiresSeconds` (120s), `purpose`. | Soft lavender `#EEE8FA` card, 36px monospace bold code, Space Grotesk header. Short security footer. | Never logs OTP. Plain-text version included. Strict 120s TTL notice. |
| `renderOrderConfirmationEmail` | P1 (Transactional Order) | Order received confirmation. Fields: `orderNumber`, `billNumber`, `totalAmountPaise`, `paymentMethod`, `shippingAddress`, `items[]`. | Structured summary card, tabular breakdown with item quantities, primary CTA button (`#844AFB`), mandatory footer. | Server computes totals from paise; no client tampering. |
| `renderPaymentConfirmationEmail` | P1 (Transactional Payment) | Gateway payment authorization. Fields: `orderNumber`, `paymentId`, `billNumber`, `amountPaise`. | Violet highlight card, payment reference table, invoice link CTA, mandatory footer. | Dispatched upon Razorpay HMAC verified webhook or server verification. |
| `renderOrderStatusUpdateEmail` | P1 (Shipment Dispatch) | Carrier dispatch and tracking notice. Fields: `orderNumber`, `status`, `courierName`, `trackingNumber`, `trackingUrl`. | AWB tracking badge, carrier metadata, direct tracking button CTA, mandatory footer. | Idempotent transition tracking prevents duplicate notifications. |
| `renderBackInStockEmail` | P2 (Customer Inventory Alert) | Replenished product alert. Fields: `productName`, `productSlug`, `priceRupees`, `unsubscribeUrl`. | Product highlight card, direct order button, one-click RFC 8058 compliant unsubscribe link, mandatory footer. | Suppressed automatically if daily quota reaches 70%. |
| `renderSecurityAlertEmail` | P0 (Account Protection) | Password changed, suspicious login. Fields: `customerName`, `actionTitle`, `description`, `timestamp`. | Bordered alert container with `#844AFB` accent line, support contact, short security footer. | Contains no credentials or session tokens. |
| `renderDesignTestEmail` | P2 (Internal Verification) | Standard design verification sample email for previewing styles, typography, and logo. | Full responsive showcase card with notice disclaimer, features grid, CTA, and mandatory footer. | Restricts recipient to authorized test addresses; safe non-workflow test. |

---

## 3. Mandatory Footer & Asset Standard
Every single template adheres to the exact mandatory signature:
```text
Thanks & Regards,
Team TTRC
Think it. Build it. Make it. Move it.
https://www.ttrc.store/
Coimbatore, Tamil Nadu • Pan-India Express Robotics Delivery

+91 7904902978
```
In HTML, the official TTRC logo (`https://www.ttrc.store/brand/ttrc-logo.png`) is presented at a crisp 160px width on a clean light background immediately adjacent to the team signature, with a subtle border divider separating it from the message body.

