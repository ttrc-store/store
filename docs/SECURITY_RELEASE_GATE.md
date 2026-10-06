# TTRC Store — Security Release Gate Protocol

This document defines the **final pre-launch Security Release Gate** to be executed immediately before public launch.

The objective of this gate is **NOT** merely to audit source code, but to **black-box verify that all security controls are active and enforcing policies on the live deployed production environment (`https://ttrc.store`)**.

---

## 1. End-to-End Release Pipeline

```
  SOURCE CODE
       │  (TypeScript strict mode, Zod schemas, 0 mock data)
       ▼
  BUILD & INSTRUMENTATION
       │  (assertProductionSecrets boots, Next.js bundle compiles)
       ▼
  VERCEL PRODUCTION ENVIRONMENT
       │  (Edge Middleware verifies HMAC JWT, blocks test bypass)
       ▼
  REAL ttrc.store DEPLOYMENT
       │  (HSTS, CSP, nosniff, DENY, deprecated headers removed)
       ▼
  REAL API RESPONSES
       │  (Distributed rate limit counters fire 429 on abuse)
       ▼
  REAL MONGODB ATLAS
       │  (TLS 1.3, SCRAM auth, atomic stock deduction, TTL indexes)
       ▼
  REAL PAYMENT WEBHOOK
          (Exact financial invariant: payment amount === order amount)
```

---

## 2. Automated Release Gate Execution

To execute the automated black-box release gate against any environment (production or Vercel preview):

```bash
# Against production
pnpm security:gate https://ttrc.store

# Against a Vercel preview deployment
pnpm security:gate https://ttrc-store-preview.vercel.app
```

The script runs automated live checks:
1. **Live HSTS & Security Headers**: Confirms `Strict-Transport-Security` (`max-age=63072000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
2. **Deprecated Header Check**: Asserts `X-XSS-Protection` is absent (avoiding legacy MDN-deprecated behavior).
3. **CSP Directives**: Asserts `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, and Razorpay/media origins.
4. **Production Test Bypass Lockdown**: Sends `Cookie: ttrc_test_bypass=true` to `/admin` and verifies it is blocked (returns 307/308 redirect to login or 401/403).
5. **Search ReDoS & Input Length Capping**: Injects 250+ character strings with regex metacharacters and verifies graceful server handling.
6. **Live Razorpay Webhook Signature Verification**: Forges HMAC signature and verifies HTTP 400 rejection.
7. **Storefront Zero-Mock Scan**: Scans live HTML of `/` and `/checkout` to confirm no placeholder customer records or test addresses are served.
8. **Live Rate Limiting Reaction**: Simulates rapid request bursts and checks throttling.

---

## 3. The Final Antigravity "Security Release Gate" Prompt

Copy and paste the exact prompt below into Antigravity when initiating the final launch verification:

```markdown
Run the TTRC Store Security Release Gate against the deployed production system:

Target: https://ttrc.store

Do not merely check source code or local files. Perform a black-box verification of the full live production stack:
SOURCE CODE -> BUILD -> VERCEL PRODUCTION -> REAL ttrc.store -> REAL API RESPONSES -> REAL MONGODB -> REAL PAYMENT WEBHOOK

Execute:
1. Run `pnpm security:gate https://ttrc.store` and report results.
2. Verify live HTTP security headers (HSTS, nosniff, DENY, CSP frame-ancestors none, no deprecated X-XSS-Protection).
3. Verify that `ttrc_test_bypass` cookies are rejected on protected endpoints.
4. Verify that the Razorpay webhook enforces the exact financial invariant (payment amount === authoritative order amount), rejecting underpayments and flagging overpayments for reconciliation.
5. Verify that distributed rate limiting is operational across serverless instances.
6. Confirm that zero mock or hardcoded customers exist in live MongoDB or rendered storefront pages.

Provide a definitive PASS/FAIL certification for public ecommerce launch.
```

---

## 4. Release Criteria Checklist

| Check | Requirement | Pass Condition |
|---|---|---|
| **High-Entropy Secrets** | `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | >= 32 bytes, high Shannon entropy, 0 reuse, non-default |
| **Distributed Rate Limiting** | Multi-instance serverless state | Upstash Redis REST or MongoDB Atlas TTL store active |
| **Payment Exact Invariant** | Gateway payment verification | `payment amount === order total paise` |
| **Atlas Network Access** | Egress IP policy | Pro Static IPs / PrivateLink or least-privilege SCRAM + TLS |
| **Headers Clean** | Modern production baseline | Strict CSP + HSTS, deprecated `X-XSS-Protection` removed |
| **Bypass Disabled** | Test cookies in production | Unconditionally blocked when `NODE_ENV === 'production'` |
