# TTRC Store: Security Architecture, Operations & Release Policy

- **Application:** TTRC Store (`ttrc.store` / `ttrc.shop`)
- **Company:** Tamizh Tech, Coimbatore, Tamil Nadu
- **Stack:** Next.js (App Router), TypeScript, MongoDB Atlas, Vercel, Razorpay, Resend

---

## 1. Security Architecture & Defense-in-Depth

| Layer | Implementation | Protection |
| :--- | :--- | :--- |
| **Edge & HTTP Headers** | Configured in `apps/web/next.config.ts` | `HSTS` (Strict-Transport-Security), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP frame-ancestors 'none'. |
| **Authentication & Sessions** | JWT signed with `JWT_SECRET`, stored in `httpOnly`, `secure`, `sameSite: 'lax'` cookies. | Prevents XSS cookie theft and script access. |
| **Multi-Device Session Revocation** | `token_version` on User model and embedded in JWT session. | Changing passwords, resetting credentials, or disabling an account increments `token_version`, immediately invalidating all active sessions. |
| **Administrative Step-Up Auth** | `requireAdminReauth` (15-min sliding window cookie `ttrc_admin_reauth` or inline password). | High-impact actions (site settings, refunds, cancellations, product deletion, customer deactivation) require recent password confirmation. |
| **Server-Authoritative Pricing** | Recomputed on server from MongoDB database prices in `actions/checkout.ts`. | Client-submitted totals, discounts, and prices are completely ignored. |
| **Inventory Concurrency** | Atomic conditional deduction (`stock_quantity: { $gte: quantity }`) with rollback. | Prevents overselling race conditions under concurrent checkouts. |
| **Payment Integrity** | Authoritative Razorpay verification (`amountPaise === order.total`) & HMAC-SHA256 webhooks. | Timing-safe verification prevents payment tampering, replay attacks, and underpayment exploits. |
| **Customer Data Isolation** | Owner/Admin session checks + 256-bit cryptographic guest tokens (`crypto.timingSafeEqual`). | Prevents BOLA / IDOR on invoices and orders; returns uniform HTTP 404 with zero customer PII on failure paths. |
| **Anti-Caching Directives** | `Cache-Control: private, no-cache, no-store, must-revalidate`, `Referrer-Policy: no-referrer` on invoices. | Prevents CDN, browser, proxy, or history caching of customer invoice PII. |
| **Database Access** | MongoDB Atlas with least-privilege application user (`readWrite@ttrc_store`). | Zero administrative database privileges granted to web application runtime. |

---

## 2. Production Release Gate: CONDITIONAL Status

The production release gate tracks required verification steps prior to public deployment.

**Current Release Gate Status:** **`CONDITIONAL` (Pending Operator Atlas Rotation)**

### Mandatory Operator Checklist Before Public Deployment:

1. **Rotate MongoDB Atlas Database User:**
   - Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
   - Navigate to **Security** -> **Database Access**.
   - Create a replacement database user (e.g. `ttrc_app_user_v2`) restricted to `readWrite@ttrc_store` role only.
   - Generate a strong random password (>= 24 characters, URL-encode special characters such as `@`, `:`, `/`, `?`, `#`).
2. **Update Vercel Environment Variables:**
   - Log in to [Vercel Project Settings](https://vercel.com/) -> **Environment Variables**.
   - Update `MONGODB_URI` in **Production** and **Preview** environments.
   - Trigger a preview deployment and verify database connectivity.
3. **Revoke Exposed Credential:**
   - Delete or disable the compromised database user (`ttrcstoree_db_user`) in MongoDB Atlas.
   - Verify that the old connection string can no longer connect.
4. **Initial Administrator Provisioning:**
   - Configure `INITIAL_ADMIN_PASSWORD` (min 12 chars, uppercase, lowercase, digit, symbol) in server environment variables.
   - Ensure the password is never logged or exposed to client-side bundles.
5. **Approve Production Release:**
   - Confirm all automated tests pass (`pnpm test` and `node scripts/securityAudit.mjs`).
   - Change gate status to **`PASS`** and deploy to production.

---

## 3. Secret Rotation & Incident Response Procedures

### Secret Rotation Protocol

| Secret | Rotation Location | Impact & Recovery Procedure |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas & Vercel | Create replacement Atlas user with `readWrite@ttrc_store`, update Vercel, redeploy, verify, then revoke old user. |
| `JWT_SECRET` | Vercel Environment | Update in Vercel and redeploy. Instantly invalidates all active sessions, requiring users to log in again. |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard & Vercel | Generate new key in Razorpay, update Vercel, redeploy, and disable old key in Razorpay. |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard & Vercel | Update secret in Razorpay Webhook settings, update Vercel, and redeploy. |
| `RESEND_API_KEY` | Resend Console & Vercel | Create replacement key with sending access only, update Vercel, delete old key. |

---

## 4. Rate Limiting Configuration

Sliding window rate limiter enforced via `lib/security/rate-limiter.ts`:

| Action / Endpoint | Limit | Window | Fallback / Behavior |
| :--- | :--- | :--- | :--- |
| Customer Login | 5 attempts | 5 minutes | HTTP 429: "Too many failed login attempts." |
| Customer Registration | 3 registrations | 10 minutes | HTTP 429: "Too many registration attempts." |
| Admin Reauthentication | 5 attempts | 10 minutes | HTTP 429: "Too many reauthentication attempts." |
| Password Reset Request | 3 requests | 15 minutes | HTTP 429: Rate limit alert |
| Coupon Verification | 10 attempts | 1 minute | Block attempt |
| Order Creation | 5 orders | 1 minute | Block attempt |
| Product Search API | 40 queries | 1 minute | Rate limited |

---

## 5. Compliance & Privacy (India DPDP Act 2023)

- **Customer Data Export:** User account dashboard provides a 1-click **Download My Data** feature exporting all profile, address, order, and review records as JSON.
- **Account Deletion:** 1-click account deletion request flags the record for anonymization and deletion within 30 days per Indian DPDP guidelines.
- **Grievance Officer:** Mandatory contact details and grievance redressal mechanisms are published in the site footer per Consumer Protection E-Commerce Rules 2020.
