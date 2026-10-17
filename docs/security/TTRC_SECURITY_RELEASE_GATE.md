# TTRC Store — Production Security Release Gate
**Platform:** TTRC Store (`ttrc.store` / `ttrc.shop`)  
**Scope:** Pre-Deployment Production Security Release Evaluation  
**Date:** October 17, 2026  
**Current Evaluation Status:** **CONDITIONAL (Pending External Operator Action)**

---

## 1. Release Gate Criteria & Decision Framework

The TTRC Store release gate evaluates whether the codebase and infrastructure are hardened against unauthorized access, payment fraud, account takeover, and data leaks before public release.

Three release states are defined:
- **PASS:** All critical security controls are implemented and verified in code, regression tests pass, and all external provider credentials have been verified and secured.
- **CONDITIONAL:** Codebase security remediations are complete and independently verified by automated regression test suites, but release to production requires a specific external administrative action (e.g. rotating an exposed Atlas password in provider console and updating Vercel).
- **BLOCK:** Critical authentication, authorization, payment integrity, or data-loss vulnerabilities remain unresolved in the application.

---

## 2. Release Gate Evaluation Matrix

| Category | Control / Invariant Evaluated | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **Database Security (SEC-01)** | Zero hardcoded connection strings or passwords in source code | **PASS (Code)** | Verified in `apps/web/src/lib/mongodb/client.ts`. Zero plaintext secrets in repo. |
| **Database Security (SEC-01)** | Atlas user password rotated in MongoDB Atlas Console | **PENDING OPERATOR** | Mandatory operator action to create replacement least-privilege Atlas user, verify connectivity, and revoke old user. |
| **Admin Identity (SEC-02)** | Zero fallback passwords or backdoor hash overrides | **PASS** | Removed lines 90–94 in `apps/web/src/actions/auth.ts`. Strict bcrypt comparison against stored hash only. |
| **Customer Data Isolation (SEC-03)** | Invoice BOLA/IDOR protection & elimination of `isRecentOrder` bypass | **PASS** | Strict owner/admin session check + high-entropy guest token with timing-safe SHA-256 comparison verified. |
| **Response Invariance & Zero PII (SEC-03)** | Identical 404 for nonexistent & unauthorized orders; zero PII leakage | **PASS** | Evaluated full response body and headers. Strict `{ error: 'Invoice not found or access denied.' }` and private no-store headers. |
| **Token Lifecycle & Revocation (SEC-03)** | Token revocation upon cancellation/refund | **PASS** | Verified guest invoice tokens are automatically rejected if order status is `cancelled`, `refunded`, or explicitly revoked. |
| **Seeder Hardening (SEC-04)** | Zero predictable admin passwords seeded & complexity enforced | **PASS** | Default password hash removed. Requires `INITIAL_ADMIN_PASSWORD` (min 12 chars, upper/lower/digit/symbol, no blacklist). Zero password logging. |
| **Session Revocation (SEC-05)** | Multi-device session revocation via `token_version` | **PASS** | Added `token_version` to User model and JWT session. Password resets, password changes, and account disablement atomically increment `token_version`. |
| **Admin Reauthentication (SEC-06)** | Sensitive operations reauthentication | **PASS** | Implemented `requireAdminReauth` (15-min sliding window or inline password challenge). Enforced on site settings, terminal order states (`refunded`, `cancelled`), product deletion, and customer deactivation. |
| **Payment Hardening (SEC-07)** | Zero fallback `rzp_test_` keys in payment test page | **PASS** | Hardcoded test key removed from `payment-test/page.tsx`. Reads strictly from env. Middleware blocks `/payment-test` in production. |
| **Payment Integrity** | Server-authoritative amounts & timing-safe Razorpay webhook HMAC | **PASS** | Verified in `api/create-order` and `api/webhooks/razorpay`. Invariant `amount === order.total` enforced. |
| **Inventory Concurrency** | Atomic conditional deduction (`$gte`) & rollback | **PASS** | Verified in `actions/checkout.ts`. Zero overselling race conditions. |
| **Edge & HTTP Headers** | HSTS, CSP frame-ancestors none, X-Frame-Options DENY, nosniff | **PASS** | Configured in `apps/web/next.config.ts`. |
| **Automated Test Coverage** | Regression tests & Comprehensive Audit | **PASS** | 223 unit/security tests pass (100% across 16 files). `securityAudit.mjs` passes 43/43 checks (100%). |
| **Production Build** | Static generation & Turbopack build | **PASS** | `pnpm build` succeeded in 49.8s across all 56 routes. |

---

## 3. Current Release State: CONDITIONAL

### Why the state is CONDITIONAL:
The application source code is **100% remediated and independently verified** across all findings (SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07). However, because the MongoDB Atlas database user password was previously exposed in commits prior to this cleanup, **deploying this code to production with the old Atlas user still active means the database is still exposed to anyone with access to past commit history**.

### Immediate Operator Action to achieve PASS:
1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Navigate to **Database Access** -> Add New Database User (e.g. `ttrc_app_user_v2`) with `readWrite@ttrc_store` least-privilege role.
3. Update `MONGODB_URI` in [Vercel Project Settings](https://vercel.com/) (Production & Preview environments).
4. Verify application connectivity against the database.
5. Delete the compromised database user (`ttrcstoree_db_user`) from MongoDB Atlas.
6. Once complete, flip the release state to **PASS** and proceed with deployment.

---

## 4. Pre-Deployment Operator Checklist

- [x] SEC-01: Remove hardcoded DB credentials from application source code.
- [x] SEC-02: Remove admin login backdoor from application source code.
- [x] SEC-03: Close invoice BOLA/IDOR, enforce token-based/owner authorization, verify full response body/headers for zero PII, and enforce token revocation on order cancellation.
- [x] SEC-04: Remove default admin password from database seeder, enforce complexity (>= 12 chars, upper/lower/digit/symbol, no blacklist), and guarantee zero password logging.
- [x] SEC-05: Implement multi-device session revocation via `token_version` on password changes, resets, and user deactivation.
- [x] SEC-06: Implement recent administrative reauthentication (`requireAdminReauth`) for sensitive operations (settings, refunds, cancellations, product deletion, customer deactivation).
- [x] SEC-07: Remove hardcoded test key from payment test page and ensure route is blocked in production.
- [x] Pass all unit, integration, and security regression tests (`pnpm test` — 223/223 passed).
- [x] Pass all comprehensive security controls (`node scripts/securityAudit.mjs` — 43/43 passed).
- [x] Verify production build passes cleanly (`pnpm build` — 56/56 routes).
- [ ] **Operator:** Create new Atlas user with `readWrite@ttrc_store` least privilege.
- [ ] **Operator:** Update `MONGODB_URI` in Vercel environment variables (Production and Preview).
- [ ] **Operator:** Delete compromised Atlas database user.
- [ ] **Operator:** Authorize final git push and deployment.
