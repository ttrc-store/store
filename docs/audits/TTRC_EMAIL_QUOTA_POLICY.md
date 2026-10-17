# TTRC Store — Resend Free-Tier Quota Management & Priority Policy

**Document Reference**: `docs/audits/TTRC_EMAIL_QUOTA_POLICY.md`  
**Date**: October 17, 2026  
**Auditor**: Antigravity Autonomous Security Engineer  
**Status**: ACTIVE POLICY

---

## 1. Context & Quota Constraints

Resend's published Free tier operates under two hard limits:
- **Daily Limit**: 100 emails / calendar day (UTC reset)
- **Monthly Limit**: 3,000 emails / calendar month (UTC reset)

Because multiple apps or developers may share the same Resend team account and API key, TTRC Store cannot assume that 100% of the account limit is exclusively reserved for store traffic. Therefore, TTRC Store implements an internal safety buffer and priority-based quota guard to ensure critical account verifications and customer order receipts are never starved by non-essential emails.

---

## 2. Priority Classification Framework

| Priority | Category | Email Types | Business Justification | Policy Action Under Pressure |
|---|---|---|---|---|
| **P0** | **Account Security** | Registration OTP, Password-Reset OTP, Email Change Verification | Essential for store access, customer onboarding, and account protection. | **Highest Priority**: Guaranteed dispatch up to 95% threshold; never suppressed until 100% hard limit. |
| **P1** | **Essential Commerce** | Order Confirmation, Verified Payment Confirmation, Courier Shipment Tracking, Security Alerts | Statutory and operational fulfillment receipts required for Indian consumer commerce. | **High Priority**: Guaranteed dispatch up to 95% threshold; protected under Strict Reserve. |
| **P2** | **Deferrable Notifications** | Back-in-Stock Alerts | Recaptures lost sales, but non-fatal if held temporarily. | **Paused at 85%**: Suppressed and deferred until daily counter resets. |
| **P3** | **Non-Essential** | Marketing, Newsletters, Promotional Campaigns | Discretionary traffic. | **Suppressed at 70%**: Paused immediately to preserve transactional headroom. |

---

## 3. Internal Quota Thresholds & Safety Buffers

To guarantee that TTRC Store never abruptly crashes or breaches Resend account caps, the platform configures conservative internal buffers via [quota-manager.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/email/quota-manager.ts):

| Configuration Variable | Default Value | Provider Limit | Safety Buffer | Rationale |
|---|---|---|---|---|
| `EMAIL_DAILY_INTERNAL_CAP` | `90` | 100 / day | 10 emails | 10% reserve for out-of-band admin notifications and external team usage. |
| `EMAIL_MONTHLY_INTERNAL_CAP` | `2,700` | 3,000 / month | 300 emails | 10% monthly safety reserve. |
| `EMAIL_QUOTA_WARNING_THRESHOLD` | `0.70` (70%) | — | — | Early warning trigger that halts P3 traffic. |

### Quota Threshold Waterfall:
```
Total Capacity (90/day)
│
├── 0%  - 69%  : NORMAL (All categories P0, P1, P2, P3 allowed)
│
├── 70% - 84%  : WARNING_P3_SUPPRESSED (P3 marketing halted, operational warning logged)
│                 [Day: >= 63 emails | Month: >= 1,890 emails]
│
├── 85% - 94%  : ELEVATED_P2_PAUSED (P2 back-in-stock alerts halted)
│                 [Day: >= 77 emails | Month: >= 2,295 emails]
│
├── 95% - 99%  : STRICT_RESERVE (ONLY P0 OTP and P1 Order confirmations permitted)
│                 [Day: >= 86 emails | Month: >= 2,565 emails]
│
└── 100%       : EXHAUSTED (Halt all email safely; emit operator alert; return friendly retry)
                  [Day: >= 90 emails | Month: >= 2,700 emails]
```

---

## 4. Atomic Ledger Implementation: `EmailQuotaLedgerModel`

To prevent concurrent serverless functions on Vercel from overrunning limits, every transmission is tracked in MongoDB via an atomic upsert:

```typescript
await EmailQuotaLedgerModel.findOneAndUpdate(
  { date_key: dateKey, category },
  {
    $setOnInsert: { month_key: monthKey, category },
    $inc: { accepted_count: 1, attempt_count: 1 },
  },
  { upsert: true }
);
```

- Key format: `date_key: "YYYY-MM-DD"`, `month_key: "YYYY-MM"`.
- Indexes: Unique compound index on `{ date_key: 1, category: 1 }` guarantees atomic isolation.

---

## 5. Resend Usage API (`GET /usage`) Integration Status

### Verification Findings:
- Endpoint: `https://api.resend.com/usage`
- Permission Check: Executed live check on October 17, 2026.
- Result: **HTTP 401 Unauthorized** (`{"statusCode":401,"message":"This API key is restricted to only send emails","name":"restricted_api_key"}`).
- Integration Status: **BLOCKED (Requires Resend Team Full-Access Key)**.

### Operational Procedure for Operators:
Because the production key has send-only privileges, operators should follow this weekly dashboard procedure:
1. Log in to [https://resend.com/overview](https://resend.com/overview).
2. Check the **Emails sent this month** and **Daily usage** widget.
3. Compare against the TTRC Store Admin Panel:
   - Call `getEmailQuotaSummaryAction()` from the admin settings portal to inspect the internal ledger vs provider usage.
4. If monthly usage exceeds 2,500, consider upgrading to Resend Pro ($20/mo, 50,000 emails) or requesting a dedicated Team Key with Usage read permissions.
