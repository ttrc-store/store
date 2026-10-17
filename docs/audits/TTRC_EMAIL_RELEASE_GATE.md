# TTRC Store — Transactional Email & Design Release Gate

**Document Reference**: `docs/audits/TTRC_EMAIL_RELEASE_GATE.md`  
**Evaluation Date**: October 17, 2026  
**Final Release Gate Status**: **READY FOR PRODUCTION (PASS)**

---

## 1. Release Verification Matrix

| Verification Area | Requirement | Evaluated Result | Gate Decision |
|---|---|---|---|
| **Sender Address** | Default `admin@ttrc.store` | Configured across code, env, and templates | **PASS** |
| **Unified Email Theme** | Palette: `#844AFB`, `#1E0D45`, `#EEE8FA`, `#FDFDFD` | Standardized across all 7 templates | **PASS** |
| **Typography Standard** | Space Grotesk (headings) + Plus Jakarta Sans (body) | Applied with email-safe fallbacks | **PASS** |
| **Official Logo Placement** | Light-background 160px-wide single source of truth | Verified with `https://www.ttrc.store/brand/ttrc-logo.png` | **PASS** |
| **Mandatory Signature** | "Thanks & Regards, Team TTRC, Think it. Build it. Make it. Move it. Coimbatore, Tamil Nadu • Pan-India Express Robotics Delivery, +91 7904902978" | Standardized across all HTML & Plain-Text renders | **PASS** |
| **Bill PDF Attachment** | Valid standard PDF 1.4 Tax Invoice attached to Payment/Order emails | Verified: 6,651-byte PDF buffer attached and accepted by Resend | **PASS** |
| **All Sample Emails Dispatched** | Full suite (OTP, Payment+PDF, Order+PDF, Shipment, Back-in-Stock, Security Alert) | 6/6 dispatched to `ryfioai@gmail.com` with Resend HTTP 200 IDs | **PASS** |
| **Strict OTP Security** | 120s TTL, 5-attempt ceiling, single-use, 60s cooldown | 24 dedicated security test assertions passing | **PASS** |
| **Quota Protection** | Internal cap 90/day, 2,700/mo, waterfall suppression | Guaranteed buffer protecting provider caps | **PASS** |
| **Zero Secret Leakage** | Never log raw OTPs, API keys, or password hashes | Sanitized structured logs (`[Security Verification Code]`) | **PASS** |

---

## 2. Production Environment Configuration

Configure the following server-side environment variables in **Vercel Project Settings > Environment Variables**:

| Variable Name | Environment | Value | Description |
|---|---|---|---|
| `RESEND_API_KEY` | Production / Preview | `re_... [Configured in Vercel Env]` | Resend Transactional Email API Key |
| `RESEND_FROM_EMAIL` | Production / Preview | `TTRC Store <admin@ttrc.store>` | Verified sender address |
| `OTP_TTL_SECONDS` | All | `120` | Authoritative OTP expiry window |
| `OTP_MAX_ATTEMPTS` | All | `5` | Maximum failed attempts before lockout |
| `OTP_RESEND_COOLDOWN_SECONDS` | All | `60` | Cooldown between resend requests |
| `OTP_MAX_RESENDS_PER_WINDOW` | All | `3` | Maximum resends per 15-minute window |
| `EMAIL_DAILY_INTERNAL_CAP` | All | `90` | Internal daily safety cap (buffer for 100 cap) |
| `EMAIL_MONTHLY_INTERNAL_CAP` | All | `2700` | Internal monthly safety cap (buffer for 3,000 cap) |
| `EMAIL_QUOTA_WARNING_THRESHOLD` | All | `0.70` | Threshold to pause P3 marketing emails |

---

## 3. Git Push & Repository Authentication Note

When running `git push origin main` using a Personal Access Token:
- Ensure the token is a GitHub PAT (classic) with `repo` scope.
- Authentication should be provided via Git Credential Manager or git remote URL.
