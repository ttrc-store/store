# TTRC Store — Attack Surface Inventory & Endpoint Catalog
**Target Platform:** TTRC Store (`ttrc.store` / `ttrc.shop`)  
**Document Classification:** Security Architecture & Attack Surface Mapping  
**Date:** October 17, 2026

---

## 1. Inventory Overview

This catalog enumerates every public and private endpoint, Server Action, webhook handler, background trigger, cookie, and HTTP header in the TTRC Store application. Each entry specifies its HTTP method, path/identifier, authorization requirements, input validation, rate limiting, and risk classification.

---

## 2. API Route Handlers (`/api/*`)

| Path | Method | Access Level | Rate Limit | Input Validation | Primary Risk / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/create-order` | POST | Authenticated Customer or Guest | 10 req/min | Server-Authoritative (`order.total`) | Financial state tampering; strictly loads amount from MongoDB. |
| `/api/verify-payment` | POST | Authenticated Customer or Guest | 10 req/min | Razorpay Signature & Gateway Fetch | Payment spoofing; timing-safe HMAC verification enforced. |
| `/api/webhooks/razorpay` | POST | Public (Gateway Callback) | None (Gateway driven) | HMAC-SHA256 Timing-Safe Equal | Webhook forgery & replay; deduplicated via `event_id` audit log. |
| `/api/invoice/[id]` | GET | Authenticated Owner or Valid Guest Token | None | URL Param + DB Find | BOLA/IDOR PII leakage; must require signed guest token or session. |
| `/api/search` | GET | Public | 60 req/min | Max 100 chars, sanitized regex | ReDoS / DB resource exhaustion. |
| `/api/categories` | GET | Public | Cacheable (Edge) | None (Read-only) | Low risk catalog retrieval. |
| `/api/pincode/[pincode]` | GET | Public | 30 req/min | 6-digit regex validation | Pincode scraping / lookup abuse. |
| `/api/stock-subscriptions` | POST | Public | 5 req/min per email | Zod Schema (`productId`, `email`) | Email spamming / quota exhaustion. |
| `/api/stock-subscriptions/unsubscribe` | GET | Public (Token Required) | None | 24-char hex token lookup | Unsubscribe token guessing. |
| `/api/ai/customer-support` | POST | Public | 12 req/min | Zod Schema (max 1000 chars) | LLM prompt injection / credit exhaustion. |
| `/api/admin/ai/generate-product-details` | POST | Admin Only (`requireAdmin`) | 20 req/min | Zod Schema | Unauthorized AI generation cost. |
| `/api/admin/media/upload` | POST | Admin Only (`requireAdmin`) | 10 req/min | Magic bytes + Sharp WebP conversion | Malicious file upload / polyglot exploit. |
| `/api/media/[filename]` | GET | Public | Cacheable (1 Year) | Filename string lookup | Path traversal; prevented by random server-generated names. |
| `/api/uploads/products/[filename]` | GET | Public | Cacheable (1 Year) | Filename string lookup | Legacy product image serving route. |
| `/api/feeds/google-merchant` | GET | Public | Cacheable (1 Hour) | None (Read-only XML) | Low risk; public catalog export. |
| `/api/feeds/chatgpt` | GET | Public | Cacheable (1 Hour) | None (Read-only JSON) | Low risk; public catalog schema. |
| `/api/health` | GET | Public | None | None | Service liveness probe. |

---

## 3. Server Actions (`apps/web/src/actions/*`)

### Authentication & Account Actions (`actions/auth.ts`)
| Action Name | Access Level | Rate Limit | Input Validation | Risk & Controls |
| :--- | :--- | :--- | :--- | :--- |
| `registerAction` | Public | 3 attempts / 10 min | Zod (`RegisterSchema`) | Role escalation prevention; always forces `role: 'customer'`. |
| `loginAction` | Public | 5 attempts / 5 min | Zod (`LoginSchema`) | Brute force; bcrypt verify, rate-limited by IP and email. |
| `logoutAction` | Authenticated | None | None | Clears `ttrc_session` cookie. |
| `requestPasswordResetAction` | Public | 3 attempts / 15 min | Zod (`ResetRequestSchema`) | User enumeration; returns generic success response. |
| `verifyOtpAndResetPasswordAction` | Public | 5 attempts max | Zod (`ResetPasswordSchema`) | OTP brute force; 120s TTL, single-use atomic consumption. |
| `changePasswordAction` | Authenticated | 5 attempts / hour | Zod (`ChangePasswordSchema`) | Session hijacking; requires existing password verification. |
| `updateProfileAction` | Authenticated | 10 attempts / hour | Zod (`ProfileSchema`) | Mass assignment prevention; ignores role/permission fields. |

### Checkout & Order Actions (`actions/checkout.ts`, `actions/orders.ts`)
| Action Name | Access Level | Rate Limit | Input Validation | Risk & Controls |
| :--- | :--- | :--- | :--- | :--- |
| `createOrderAction` | Customer / Guest | 5 orders / min | Zod (`CheckoutSchema`) | Price tampering; recomputes totals strictly from DB records. |
| `cancelOrderAction` | Authenticated Owner | 5 attempts / min | Zod (`CancelOrderSchema`) | IDOR; checks `order.user_id === user.id`. Auto-restocks inventory. |
| `requestOrderReturnAction` | Authenticated Owner | 5 attempts / min | Zod (`ReturnOrderSchema`) | Fraudulent returns; requires `order.status === 'delivered'`. |
| `getMyOrdersAction` | Authenticated Customer | None | Session `user.id` | IDOR; query strictly filtered by `{ user_id: auth.user.id }`. |
| `getMyOrderAction` | Authenticated Customer | None | Session `user.id` | IDOR; query strictly filtered by `{ user_id: auth.user.id }`. |

### Administrative Actions (`actions/admin*.ts`, `actions/settings.ts`)
| Action Name | Access Level | Authorization Check | Sensitive Capabilities |
| :--- | :--- | :--- | :--- |
| `getAdminOrdersAction` | Admin / Staff | `requireAdmin()` | Views customer order history, amounts, addresses. |
| `updateAdminOrderStatusAction` | Admin / Staff | `requireAdmin()` | Modifies fulfillment status (dispatched, delivered). |
| `issueAdminRefundAction` | Admin Only | `requireAdmin()` | Triggers gateway refund; requires amount and status validation. |
| `createAdminProductAction` | Admin Only | `requireAdmin()` | Publishes catalog items, sets prices and stock levels. |
| `updateAdminProductAction` | Admin Only | `requireAdmin()` | Edits specifications, pricing, HSN codes, and images. |
| `deleteAdminProductAction` | Admin Only | `requireAdmin()` | Removes products from active catalog. |
| `createAdminCouponAction` | Admin Only | `requireAdmin()` | Creates discounts; requires max cap and expiry configuration. |
| `updateSiteSettingsAction` | Admin Only | `requireAdmin()` | Modifies store GSTIN, COD limits, policies, contact info. |
| `getAdminCustomersAction` | Admin / Staff | `requireAdmin()` | Accesses customer directory and account statuses. |

---

## 4. Cookies & Session Storage

| Cookie Name | Purpose | HttpOnly | Secure | SameSite | Max-Age | Path |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ttrc_session` | User / Admin JWT Session Token | **Yes** | **Yes** (Prod) | **Lax** | 7 Days | `/` |
| `ttrc_cart` | Guest shopping cart items | No | No | Lax | 30 Days | `/` |
| `ttrc_test_bypass` | Internal E2E test helper | Yes | Yes (Prod) | Lax | Session | `/` *(Strictly blocked in production)* |

---

## 5. Security Headers Inventory

The following headers are returned on all routes via `apps/web/next.config.ts`:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.youtube-nocookie.com https://player.vimeo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

---

## 6. External Third-Party Integration Surface

| Third-Party Provider | Transmission Channel | Secrets Held in App | Inbound Attack Vectors |
| :--- | :--- | :--- | :--- |
| **Razorpay** | REST API & Inbound Webhooks | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Forged webhooks, duplicate event replay, signature timing attacks. |
| **Resend** | HTTPS REST API | `RESEND_API_KEY` | Quota exhaustion, unauthorized recipient spoofing. |
| **MongoDB Atlas** | TLS Encrypted Wire Protocol | `MONGODB_URI` | Unauthorized connection, query injection, denial of service. |
| **Shiprocket** | HTTPS REST API | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` | Tracking credential tampering. |
| **Google OAuth** | OAuth 2.0 PKCE / Redirect | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Redirect URI manipulation, unverified email account takeover. |
