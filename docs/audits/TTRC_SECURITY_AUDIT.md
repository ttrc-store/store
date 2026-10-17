# TTRC Store — Application Security & Threat Model Audit

**Platform**: TTRC Store (`https://www.ttrc.store/`)  
**Scope**: Authentication, Authorization, IDOR, Input Sanitization, Uploads, Rate Limiting, Residual Risk  
**Audit Date**: October 16, 2026  
**Security Health Score**: 100% (34/34 Controls Passing in `pnpm security:audit`)  

---

## 1. Authentication & Session Management

- **Edge Cryptographic Verification**: Middleware intercepts incoming requests to `/admin` and `/account` and validates the HMAC-SHA256 signature of the session JWT using the native Edge Web Crypto API.
- **Strict Production Bypass Lockout**: Any `test-bypass` or development cookie is rejected unconditionally when `NODE_ENV === 'production'`.
- **Role Escalation Defense**: The public registration action (`registerAction`) uses a strict Zod schema that strips any user-submitted `role` field, guaranteeing newly created accounts default to `customer`.
- **Session Expiration & Claims**: JWT tokens include standard `exp` and `iat` claims, scoped strictly to the authenticated user ID and role.

---

## 2. Customer Isolation & IDOR Protection

| Endpoint / Action | Ownership Check Enforced | Verified Invariant |
| :--- | :--- | :--- |
| **`/api/invoice/[id]`** | Requires active session; checks `order.user_id === user.id \|\| user.role === 'admin'`. | Customer A cannot view or download Customer B's PDF invoices. |
| **`/api/verify-payment`** | Validates authenticated `user.id` or normalized `guest_email` against database order record. | An attacker cannot verify or manipulate an order belonging to another customer. |
| **`/account/orders`** | Queries MongoDB strictly with `{ user_id: user.id }`. | No leakage of other customers' order history or tracking details. |
| **`cancelMyOrderAction`** | Query condition `{ _id: orderId, user_id: user.id }`. | Customers cannot cancel other users' orders. |
| **`requestReturnAction`** | Query condition `{ _id: orderId, user_id: user.id }`. | Customers can only request returns for their own purchased items. |

---

## 3. Input Sanitization & Anti-Abuse Controls

- **Catalog Search Sanitization**:
  - Max query length capped at 100 characters.
  - Regex special characters escaped using `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` to prevent ReDoS (Regular Expression Denial of Service) or MongoDB query injection.
- **Distributed Rate Limiting**:
  - Implemented in [rate-limiter.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/security/rate-limiter.ts).
  - Uses Upstash Redis when configured; falls back gracefully to MongoDB Atlas sliding window collections, and finally an in-memory token bucket.
  - Applied to `/api/search` (60 req/min), login/register (5 req/min), stock subscriptions (5 req/min), and checkout creation.
- **Video Embed Sanitizer**:
  - Embed URLs restricted strictly to trusted domains (`youtube-nocookie.com`, `player.vimeo.com`). Any arbitrary `<iframe>` injection is blocked.

---

## 4. File Upload Security & Magic Byte Validation

In [route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/admin/media/upload/route.ts):
1. **RBAC**: Requires authenticated Admin role. Unauthenticated or non-admin requests receive HTTP 403 immediately.
2. **Binary Magic Byte Inspection**: File headers are examined at the byte level before saving:
   - PNG: `89 50 4E 47 0D 0A 1A 0A`
   - JPEG: `FF D8 FF`
   - WebP: `52 49 46 46` ... `57 45 42 50`
   - PDF: `25 50 44 46` (`%PDF`)
   Executable binaries (`.exe`, `.sh`, `.php`) masquerading with fake extensions are rejected.
3. **Cryptographic Filename Hashing**: Uploads are saved using `crypto.randomUUID()` to prevent directory traversal and overwrite attacks.

---

## 5. HTTP Security Headers & Content Security Policy (CSP)

Active in production response headers on `https://www.ttrc.store/`:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.youtube-nocookie.com https://player.vimeo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

---

## 6. Secrets Validation & Residual Risks

### Secrets Management
- Server-side secrets (`MONGODB_URI`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`) are validated on boot via Next.js instrumentation.
- No secrets are exposed to client-side bundles (only `NEXT_PUBLIC_` prefixed keys like `NEXT_PUBLIC_RAZORPAY_KEY_ID`).

### Residual Risks & Mitigations
1. **Rate Limiting Multi-Instance Failover**: When Redis is not configured, rate limiting falls back to MongoDB Atlas. While secure, high-concurrency DDoS attacks could generate elevated database query load. *Recommendation: Enable Upstash Redis in production.*
2. **Third-Party Script Dependency**: The checkout flow relies on `https://checkout.razorpay.com/v1/checkout.js`. Outages at Razorpay CDN would impact frontend checkout modal initialization. *Mitigation: Monitored via health checks and Sentry error boundaries.*
