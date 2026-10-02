# TTRC Store: Security Audit & Hardening Documentation

This document outlines the security architecture, threat model, access controls, rate limiting, and backup procedures implemented for TTRC Store (`ttrc.store`).

---

## 1. Security Architecture Summary

| Component | Implementation | Protection |
|---|---|---|
| **Content Security Policy (CSP)** | Configured in `next.config.ts` | Prevents XSS & untrusted script execution |
| **HTTP Security Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS | Clickjacking & MIME-sniffing protection |
| **Row Level Security (RLS)** | Supabase Postgres RLS on all 20+ tables | Prevents IDOR & unauthorized data reads/writes |
| **Server Actions & Input Validation** | Strict Zod schema validation on every write operation | Prevents SQL injection & malformed data insertion |
| **Rate Limiting** | Sliding window rate limiter in `lib/security/rate-limiter.ts` | Prevents brute force & DoS on auth/coupons/contact |
| **CAPTCHA Validation** | Cloudflare Turnstile integration | Bot submission prevention on signup & contact forms |

---

## 2. Row Level Security (RLS) Policy Audit

Every table in Supabase has RLS enabled by default:

1. **`products`, `categories`, `brands`**:
   - `SELECT`: Public (all users including anonymous).
   - `INSERT / UPDATE / DELETE`: Restricted strictly to `is_admin()` (`profiles.role IN ('admin', 'staff')`).
2. **`orders`, `order_items`, `addresses`**:
   - `SELECT / UPDATE`: Customers can only read/update their own rows (`auth.uid() = user_id`).
   - `INSERT`: Server Action creates row linked to authenticated user or guest checkout session.
3. **`payments`**:
   - Restricted strictly to `service_role` and `is_admin()`. Customers cannot directly query payment logs.
4. **`profiles`**:
   - Users can read/update their own profile fields (`full_name`, `phone`).
   - Column-level / RLS policy explicitly **blocks users from updating their own `role` field** to prevent privilege escalation.

---

## 3. Data Protection & Privacy Compliance (India DPDP Act 2023)

- **User Data Export:** `/account` panel provides a 1-click **Download My Data** action returning full JSON dump of profile, addresses, orders, and reviews.
- **Account Deletion Request:** 1-click deletion request button logs an audit record and flags account for soft-deletion & anonymization within 30 days per DPDP guidelines.
- **Cookie Consent:** Non-essential tracking scripts (GA4) are gated behind cookie consent acceptance.

---

## 4. Rate Limiting Matrix

| Endpoint / Action | Limit | Window | Action on Exceed |
|---|---|---|---|
| Signup / Login (`/actions/auth`) | 5 requests | 1 minute | Block with HTTP 429 / Toast alert |
| Pincode Serviceability Check | 10 requests | 1 minute | Return cached result or rate limit |
| Coupon Verification | 5 requests | 1 minute | Block attempt |
| Contact / Bulk Enquiry Form | 3 requests | 10 minutes | CAPTCHA mandatory |
| Product Review Submission | 2 reviews | 1 hour | Block submission |

---

## 5. Database Backup & Disaster Recovery Procedure

### Daily Backup Schedule
- Supabase automatically performs **Daily Backups** and Point-In-Time-Recovery (PITR) for Postgres database and Supabase Storage buckets.

### Manual Restore Instructions
1. Log in to [Supabase Management Console](https://supabase.com/dashboard).
2. Select `ttrc-store-prod` project -> **Database** -> **Backups**.
3. Select desired timestamp / snapshot and click **Restore to Project** or download SQL dump.
4. Verify schema integrity by running `pnpm --filter=@ttrc/web test`.
