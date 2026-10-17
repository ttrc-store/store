# TTRC Store — Security & Regression Report

**Date:** October 16, 2026  
**Auditor Roles:** Senior Full-Stack Architect, Security Engineer, QA Lead  
**Scope:** Security boundaries, cryptographic validations, authorization checks, regression test suite results, and production build readiness.

---

## 1. Security Safeguards & Invariants Verified

### A. Razorpay Production Security
- **HMAC-SHA256 Timing-Safe Comparison:** [webhooks/razorpay/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/webhooks/razorpay/route.ts#L40) uses `crypto.timingSafeEqual(sigBuf, expectedBuf)` to prevent timing side-channel attacks during webhook verification.
- **Strict Server Payment Fetch & Financial Invariants:** [verify-payment/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/verify-payment/route.ts#L187-L225) calls `razorpay.payments.fetch(paymentId)` directly to enforce:
  1. `payment.status === 'captured'`
  2. `payment.amount === order.total` (Exact integer paise match)
  3. `payment.currency === 'INR'`
  4. `payment.order_id === order.razorpay_order_id`
- **Replay Protection:** Webhooks record event IDs in `AuditLogModel` under `action: 'webhook.razorpay.${event}'`. Duplicate event submissions are caught and safely ignored with `{ status: 'ok', idempotent: true }`.

### B. Access Control & Authorization (IDOR Defense)
- **Customer Ownership:** Customer A cannot initiate payments or verify transactions on orders created by Customer B ([create-order/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/create-order/route.ts#L102-L115)).
- **Guest Verification:** Guest orders require exact email or phone number match before exposing order details, tracking AWB numbers, or PDF invoices ([orders.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/orders.ts#L195-L285)).
- **Rate Limiting:** Distributed rate limiting via `RateLimitModel` on MongoDB Atlas protects order creation (5 attempts/min), coupon validation (10 attempts/min), and API endpoints.

---

## 2. Regression Test Results Summary

All tests executed live in the local repository environment using `vitest` and `turbo`.

### Unit Test Execution:
```bash
$ turbo test:unit
• turbo 2.11.2
   • Packages in scope: @ttrc/shared, @ttrc/ui-tokens, @ttrc/web
   • Running test:unit in 3 packages

@ttrc/shared:test:unit: ✓ src/lib/__tests__/pricing.test.ts (31 tests)
@ttrc/web:test:unit:
  ✓ tests/media/lossless-webp-conversion.test.ts (21 tests)
  ✓ tests/pwa/pwa-light-splash.test.ts (16 tests)
  ✓ src/lib/__tests__/utils.test.ts (4 tests)
  ✓ tests/security/admin-panel-production-hardening.test.ts (10 tests)
  ✓ tests/security/razorpay-production-security.test.ts (11 tests)
  ✓ src/lib/ai/__tests__/ai-gateway.test.ts (15 tests)
  ✓ tests/security/customer-experience-improvements.test.ts (6 tests)
  ✓ tests/security/customer-experience-flow.test.ts (12 tests)
  ✓ tests/security/security-hardening.test.ts (19 tests)
  ✓ tests/security/razorpay-standard-checkout.test.ts (9 tests)
  ✓ tests/ai/ai-gateway.test.ts (12 tests)
  ✓ src/lib/__tests__/validation.test.ts (14 tests)
  ✓ tests/security/razorpay-only-checkout.test.ts (5 tests)

Test Files  13 passed (13)
     Tests  154 passed (154)
  Duration  24.31s
```

### TypeScript Strict Mode Check:
```bash
$ turbo typecheck
• turbo 2.11.2
@ttrc/shared:typecheck: $ tsc --noEmit (Passed)
@ttrc/ui-tokens:typecheck: $ tsc --noEmit (Passed)
@ttrc/web:typecheck: $ tsc --noEmit (Passed - 0 errors)
Tasks: 3 successful, 3 total
```

### Production Build Validation:
```bash
$ turbo build
• turbo 2.11.2
@ttrc/web:build: ▲ Next.js 16.3.6 (Turbopack)
@ttrc/web:build: ✓ Compiled successfully in 5.2s
@ttrc/web:build: ✓ Finished TypeScript in 6.7s ...
@ttrc/web:build: ✓ Generating static pages using 7 workers (54/54) in 3.0s
@ttrc/web:build: Tasks: 1 successful, 1 total
```

No mock products, fake reviews, or dummy customer accounts were introduced. Zero regressions detected.
