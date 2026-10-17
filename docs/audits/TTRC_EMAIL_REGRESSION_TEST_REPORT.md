# TTRC Store — Email Verification & Transactional Architecture Regression Test Report

**Document Reference**: `docs/audits/TTRC_EMAIL_REGRESSION_TEST_REPORT.md`  
**Date**: October 17, 2026  
**Test Runner**: Vitest v3.2.7 + TypeScript Strict Compiler  
**Test Result**: 100% PASS (15 Suites, 193 Tests)

---

## 1. Test Execution Summary

| Metric | Result | Status |
|---|---|---|
| **Total Test Suites** | 15 / 15 Passed | **PASS** |
| **Total Unit & Security Tests** | 193 / 193 Passed | **PASS** |
| **TypeScript Strict Compilation** | 0 Errors across 3 packages (`@ttrc/web`, `@ttrc/shared`, `@ttrc/ui-tokens`) | **PASS** |
| **Next.js Turbopack Production Build** | Compiled 55 routes successfully | **PASS** |
| **Zero OTP / Token Leakage** | Verified with console assertion tests | **PASS** |
| **Unified Template Rendering** | 7 Templates standardized with Space Grotesk / Plus Jakarta Sans | **PASS** |
| **Live Dispatch Verification** | 1 Test Email sent to `ryfioai@gmail.com` via Resend REST API | **PASS (HTTP 200)** |

---

## 2. Dedicated Email Verification & Quota Test Suite Breakdown

File: `apps/web/tests/security/email-verification-and-quota.test.ts`  
Status: **24 Passed, 0 Failed**

### Group 1: OTP Generation, HMAC Hashing & Invariants
- `✓ generates a 6-digit numeric OTP between 100000 and 999999`
- `✓ generates timing-safe HMAC-SHA256 hashes without storing plaintext in DB`
- `✓ normalizes email casing and whitespace so rate limits cannot be bypassed`

### Group 2: OTP Expiry (Strict 120s) and Attempt Limits
- `✓ valid OTP verification succeeds before 120 seconds`
- `✓ rejects OTP after 120 seconds (expiry enforcement)`
- `✓ rejects incorrect OTP and counts down remaining attempts`
- `✓ locks and invalidates code after 5 failed attempts`
- `✓ enforces 60-second cooldown between resend requests`
- `✓ a newly issued OTP invalidates all prior active OTPs for the same purpose`
- `✓ prevents reusing an OTP (single-use consumption invariant)`
- `✓ isolates purposes: registration OTP cannot be used for password reset`

### Group 3: Resend Free-Tier Quota & Priority Guard
- `✓ allows all priority tiers under normal threshold (< 70%)`
- `✓ suppresses P3 (marketing/promotions) when quota reaches 70% warning threshold`
- `✓ pauses P2 (back-in-stock alerts) when quota reaches 85% threshold`
- `✓ activates Strict Reserve at 95% allowing ONLY P0 & P1`
- `✓ safely halts all transmissions when quota reaches 100% capacity`
- `✓ records quota outcomes atomically in the ledger`

### Group 4: Centralized Email Dispatcher & Templates
- `✓ dispatches P0 registration verification OTP via centralized sender`
- `✓ dispatches P0 password reset OTP`
- `✓ dispatches P1 order confirmation with accurate financial and item breakdown`
- `✓ dispatches P1 payment confirmation`
- `✓ dispatches P2 back-in-stock notification`
- `✓ renders clean OTP email template with 2-minute expiry warning and text fallback`

### Group 5: Sensitive Data & Log Privacy
- `✓ never leaks raw OTPs in production logs or responses`

---

## 3. Live Design Test Message Verification (Resend API)

- **Test Recipient**: `ryfioai@gmail.com`
- **Sender Address**: `TTRC Store <admin@ttrc.store>`
- **Subject**: `TTRC Store — Email Design Test`
- **Provider Status**: `HTTP 200 OK`
- **Resend Message ID**: `01a148d7-5e78-79ac-96b6-3c222a2ab0a9`
- **HTML & Plain Text Fallback**: Both rendered and verified.
- **Logo Asset Used**: `https://www.ttrc.store/brand/ttrc-logo.png` (HTTP 200 OK, 267KB).
- **Mandatory Signature Present**:
  ```text
  Thanks & Regards,
  Team TTRC
  Think it. Build it. Make it. Move it.
  https://www.ttrc.store/
  ```
