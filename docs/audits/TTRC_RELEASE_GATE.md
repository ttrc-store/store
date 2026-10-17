# TTRC Store — Production Release Gate Checklist

**Target Platform**: TTRC Store (`https://www.ttrc.store/`)  
**Deployment**: Vercel Anycast Edge  
**Date**: October 16, 2026  
**Auditor**: Senior Full-Stack & DevOps Release Lead  
**Overall Release Gate Decision**: **CONDITIONAL GO**  

---

## 1. Release Gate Criteria Matrix

| Gate ID | Domain / Scope | Requirement | Status | Evidence / Verification Method |
| :--- | :--- | :--- | :---: | :--- |
| **GATE-01** | Payments | Server-authoritative order pricing; client amount manipulation rejected | **PASS** | Verified via `tests/security/razorpay-production-security.test.ts`. |
| **GATE-02** | Payments | COD is strictly disabled in UI, server actions, and configuration | **PASS** | Verified via `tests/security/razorpay-only-checkout.test.ts`. |
| **GATE-03** | Payments | Razorpay webhook verifies HMAC-SHA256 signature using timingSafeEqual | **PASS** | Verified in `api/webhooks/razorpay/route.ts` and automated tests. |
| **GATE-04** | Payments | Webhook deduplication prevents duplicate captures and duplicate bill numbers | **PASS** | Verified via `AuditLogModel` event_id check and idempotent returns. |
| **GATE-05** | Payments | Delayed `payment.failed` webhook cannot cancel or restock an already paid order | **PASS** | Atomic query `{ status: 'pending', payment_status: 'pending' }` verified. |
| **GATE-06** | Inventory | Stock deduction uses atomic conditional update preventing overselling | **PASS** | `$gte` check in `checkout.ts` verified under concurrency tests. |
| **GATE-07** | Inventory | Single reservation can be released at most once | **PASS** | Atomic `findOneAndUpdate` verified in `releasePendingOrderAction`. |
| **GATE-08** | Inventory | Abandoned pending checkouts (>30m) safely cleaned and restocked | **PASS** | `cleanupExpiredPendingOrdersAction` verified in unit tests. |
| **GATE-09** | Auth/Security | Edge JWT authentication enforced; test bypasses blocked in production | **PASS** | Middleware Web Crypto HMAC check and `pnpm security:audit` pass. |
| **GATE-10** | Auth/Security | Public registration cannot escalate role to admin | **PASS** | Role field stripped in Zod schema; verified in security tests. |
| **GATE-11** | Auth/Security | Customers cannot access or modify other customers' orders (IDOR) | **PASS** | Strict ownership checks on invoice and order routes verified. |
| **GATE-12** | Auth/Security | Admin media upload validates binary magic bytes and restricts to admins | **PASS** | Magic byte validator in `api/admin/media/upload` verified. |
| **GATE-13** | Features | Product documentation & in-box checklists render without internal leaks | **PASS** | Storefront tabs and admin section 11 verified; `is_verified` filter. |
| **GATE-14** | Features | Typo-tolerant technical search expands robotics terms accurately | **PASS** | Dictionary normalization verified in `tests/security/next-release-features.test.ts`. |
| **GATE-15** | Features | Back-in-stock alerts rate-limited; fires only on genuine restock transitions | **PASS** | Rate limit, deduplication, and atomic notification trigger verified. |
| **GATE-16** | Code Quality | TypeScript compilation has zero errors across all workspaces | **PASS** | `pnpm turbo typecheck` exited 0 (3/3 packages). |
| **GATE-17** | Code Quality | ESLint static analysis has zero fatal lint errors | **PASS** | `pnpm turbo lint` exited 0. |
| **GATE-18** | Code Quality | Full unit test suite passes with 100% success | **PASS** | `pnpm test:unit` passed 169/169 tests across 14 test files. |
| **GATE-19** | Build | Next.js production build succeeds with all routes compiled | **PASS** | `pnpm turbo build` exited 0 (54/54 routes). |
| **GATE-20** | Domains | Canonical domain `www.ttrc.store` resolves and responds 200 OK | **PASS** | Empirically verified via live cURL request to Vercel Anycast. |
| **GATE-21** | Domains | Secondary domain `www.ttrc.shop` 301 redirects to canonical | **PASS** | Empirically verified via HTTP HEAD request. |
| **GATE-22** | Domains | Apex domain `tamizhtech.in` DNS unified to Vercel without SSL errors | **BLOCKED** | Registrar DNS contains stale AWS IPs causing SSL Alert 112. |
| **GATE-23** | Payments | Production live Razorpay keys and webhook configured in Vercel | **BLOCKED** | Requires manual credential paste in Vercel dashboard by store owner. |
| **GATE-24** | Compliance | DPDP Act 2023 Privacy Policy, Terms, and Grievance Officer published | **PASS** | Verified routes `/privacy-policy`, `/terms`, `/grievance-officer`. |

---

## 2. Release Gate Decision

### **Verdict: CONDITIONAL GO**

#### Rationale:
- **Zero Blockers in Application Code**: All 21 software, security, data integrity, inventory concurrency, and build gates have **PASSED** with 100% reproducible test evidence.
- **Two Non-Code Conditions for Final Live Launch**:
  1. **Condition 1 (DevOps/Registrar)**: Remove stale AWS IPs from `tamizhtech.in` DNS so the apex company domain resolves cleanly to Vercel without SSL handshake alerts.
  2. **Condition 2 (Payment Ops)**: Add production Razorpay credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) to Vercel Environment Variables and configure the live webhook endpoint in the Razorpay Dashboard.

Upon completing Conditions 1 and 2, the store is officially authorized for public traffic and commercial transactions.
