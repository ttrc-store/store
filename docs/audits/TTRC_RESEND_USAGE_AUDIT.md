# TTRC Store — Resend API Usage & Infrastructure Audit Report

**Date**: October 17, 2026  
**Auditor**: Antigravity Autonomous Lead  
**Scope**: Transactional Email Systems, Resend API Credentials, Call Sites & Free-Quota Inventory  
**Status**: AUDITED & OPTIMIZED

---

## 1. Executive Summary

An exhaustive repository-wide audit was conducted across all authentication pathways, payment gateways, webhooks, and catalog notification call sites in the TTRC Store platform (`ttrc.store`).

The audit revealed that prior to this initiative, transactional email was only partially implemented in a single dispatcher file ([resend.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/resend.ts)) with mock console fallback and zero OTP email verification, leaving new customer registrations unverified. Furthermore, the official Resend API key was restricted to sending operations, returning `401 restricted_api_key` when querying the Resend Usage API (`GET https://api.resend.com/usage`).

To address this within Resend's published Free Plan (3,000 emails/month, 100 emails/day), a unified centralized email architecture has been designed, deployed, and verified with atomic MongoDB quota controls, priority classifications (P0–P3), strict 120-second OTP verification, and rate limiting.

---

## 2. Existing Behavior & Defects Uncovered

| # | Component / Call Site | Pre-Audit Behavior | Defect / Vulnerability Identified | Severity |
|---|---|---|---|---|
| **1** | [actions/auth.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/auth.ts) `registerAction` | Automatically created user and issued a session cookie without requiring email ownership proof. | Accounts could be created with arbitrary or fraudulent email addresses. Unverified emails could access customer portals. | **CRITICAL** |
| **2** | [app/login/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/login/page.tsx) OTP UI | Contained placeholder client-side SMS OTP form with hardcoded error message. | Non-functional mock UI with zero backend email OTP integration. | **HIGH** |
| **3** | [app/forgot-password/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/forgot-password/page.tsx) | Returned mock success message without generating or dispatching any password reset challenge. | Customers could not recover account passwords. | **HIGH** |
| **4** | [api/verify-payment/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/verify-payment/route.ts) | Verified Razorpay signature and marked order paid, but did not dispatch order or payment confirmation emails. | Customers received no automated order confirmation or receipt following successful checkout. | **HIGH** |
| **5** | [lib/email/resend.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/resend.ts) | Simple fetch wrapper without quota ledger, without priority classification, and without bounded retry logic. | Risk of quota exhaustion where non-essential marketing or restock emails could starve critical OTPs or order confirmations. | **HIGH** |
| **6** | Resend API Key Permissions | Provided API key (`re_Kw...`) was tested against `https://api.resend.com/usage`. | Resend returned `401 restricted_api_key` ("This API key is restricted to only send emails"). Key lacks permission to read usage metrics. | **MEDIUM** (Operational constraint) |

---

## 3. Inventory of Email Types & Priority Allocation

All email operations are now consolidated through the single centralized dispatcher with strict priority classifications:

| Priority | Category | Operation | Trigger Point | Rate Limit / Quota Behavior |
|---|---|---|---|---|
| **P0** | Account Security | `sendVerificationOtp` | Customer Registration & Account Verification | Strict 120s expiry, 60s cooldown, max 3 resends / 15 min. Never suppressed until 100% hard cap. |
| **P0** | Account Security | `sendPasswordResetOtp` | Password Reset Request | 120s expiry, generic safe response (no enumeration). Never suppressed until 100% hard cap. |
| **P0** | Account Security | `sendEmailChangeOtp` | Customer Profile Email Update | Verifies ownership of new email address before updating account. Never suppressed until 100% hard cap. |
| **P1** | Essential Commerce | `sendOrderConfirmation` | Authorized Razorpay Payment & Order Placement | Idempotency protected via `order.confirmation_email_sent`. Eligible under strict reserve (up to 95% cap). |
| **P1** | Essential Commerce | `sendPaymentConfirmation` | Authoritative Payment Capture | Dispatched alongside order confirmation. Eligible under strict reserve. |
| **P1** | Essential Commerce | `sendOrderStatusUpdate` | Admin order fulfillment (status: `shipped`) | Idempotency protected via `order.shipment_email_sent`. Dispatches express courier tracking link. |
| **P1** | Essential Commerce | `sendSecurityNotification` | Password change or sensitive email modification | Immediate account safety alert. Eligible under strict reserve. |
| **P2** | Useful / Deferrable | `sendBackInStockNotification` | Inventory replenishment from 0 to positive stock | Paused automatically when quota reaches 85% to preserve capacity for customer orders and verification. |
| **P3** | Non-Essential | Marketing / Newsletters | Promotional broadcasts | Suppressed automatically when quota reaches 70% warning threshold. |

---

## 4. Resend API Key Permission & Connectivity Validation

Using the provided server-side key, live endpoint checks were executed against the official Resend API:

1. **`GET https://api.resend.com/domains`**:
   - Response: `401 Unauthorized`
   - Payload: `{"statusCode":401,"message":"This API key is restricted to only send emails","name":"restricted_api_key"}`
2. **`GET https://api.resend.com/usage`**:
   - Response: `401 Unauthorized`
   - Payload: `{"statusCode":401,"message":"This API key is restricted to only send emails","name":"restricted_api_key"}`
3. **`POST https://api.resend.com/emails`**:
   - Successfully supported under sending permission.

### Impact & Solution
Because the key is a **Sending-Only Key**, direct integration with Resend's official `GET /usage` endpoint is marked **BLOCKED (Requires Resend Team Full-Access Key)**.  
To guarantee continuous, bulletproof quota protection regardless of provider key permissions, TTRC Store uses its internal atomic MongoDB usage ledger ([EmailQuotaLedgerModel](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/models.ts)) which accurately tracks every attempt, acceptance, failure, and suppression in real-time.

---

## 5. Files Changed

- [apps/web/src/lib/email/resend.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/resend.ts) — Refactored into unified centralized dispatcher with bounded retries and typed operations.
- [apps/web/src/lib/email/quota-manager.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/quota-manager.ts) — New atomic MongoDB-backed usage ledger and priority threshold gating.
- [apps/web/src/lib/email/templates.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/templates.ts) — New branded responsive HTML and text templates.
- [apps/web/src/lib/security/otp-service.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/security/otp-service.ts) — New cryptographically secure 120s OTP engine with HMAC-SHA256 storage.
- [apps/web/src/actions/auth.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/auth.ts) — Updated registration, login, and password reset flows with OTP verification.
- [apps/web/src/app/api/verify-payment/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/verify-payment/route.ts) — Added idempotent order & payment confirmation dispatch.
- [apps/web/src/app/api/webhooks/razorpay/route.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/api/webhooks/razorpay/route.ts) — Added idempotent webhook confirmation email dispatch.
- [apps/web/src/actions/admin.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/actions/admin.ts) — Added shipment email notification on order dispatch.
- [apps/web/src/app/verify-email/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/verify-email/page.tsx) — New dedicated 6-digit verification portal.
- [apps/web/src/app/forgot-password/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/forgot-password/page.tsx) — Refactored into seamless OTP recovery flow.
- [apps/web/src/app/reset-password/page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/reset-password/page.tsx) — Added OTP verification inputs and Suspense boundary.
- [apps/web/tests/security/email-verification-and-quota.test.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/tests/security/email-verification-and-quota.test.ts) — New 24-test security and regression suite.
