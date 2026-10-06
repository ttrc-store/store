# TTRC Store Security Runbook & Incident Response

**Application**: TTRC Store (ttrc.store)  
**Company**: Tamizh Tech, Tamil Nadu  
**Target Environment**: Vercel Serverless + MongoDB Atlas  
**Classification**: Internal Operational Security Guide  

---

## 1. Security Event Monitoring & Triage

### 1.1 Critical Security Events
The following security incidents require immediate triage:
1. **Admin Authentication Anomalies**: Repeated failed logins or sudden elevation attempts.
2. **Webhook Signature Failures**: Spike in invalid HMAC signatures hitting `/api/webhooks/razorpay`.
3. **Inventory Race Alerts**: High frequency of atomic inventory reservation rollbacks.
4. **Mass Coupon Redemptions**: Multiple rapid redemption attempts on single-use coupons.
5. **Rate-Limit Trigger Spikes**: Automated scraping or search flooding from specific CIDRs.

### 1.2 Audit Log Inspection
Administrative operations and webhook processing are logged to the MongoDB `AuditLogModel`:
```typescript
// Query recent high-sensitivity administrative actions:
const recentLogs = await AuditLogModel.find({
  action: { $in: ['product.created', 'product.updated', 'product.deleted', 'webhook.razorpay.payment.captured'] }
})
.sort({ created_at: -1 })
.limit(50);
```

---

## 2. Incident Response Playbooks

### Playbook A: Compromised Secret or API Credential
**Trigger**: A developer accidentally exposes `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, or `MONGODB_URI`.
1. **Contain**:
   - Rotate the secret immediately in the Vercel Project Settings (Environment Variables).
   - Invalidate existing customer/admin sessions by changing `JWT_SECRET`. This forces all active sessions to re-authenticate with the new secret.
2. **Investigate**:
   - Query MongoDB `AuditLogModel` for unexpected admin activities during the exposure window.
   - Inspect Razorpay dashboard for unauthorized payment or refund calls.
3. **Recover**:
   - Trigger a redeployment in Vercel to flush serverless runtime environment instances.
   - Run `node scripts/securityAudit.mjs` to confirm all security invariants pass.

### Playbook B: Rogue Webhook or Payment Anomaly
**Trigger**: Discrepancy between captured payments in Razorpay and confirmed orders in MongoDB.
1. **Contain**:
   - Rotate `RAZORPAY_WEBHOOK_SECRET` in both the Razorpay Dashboard and Vercel environment variables.
   - Temporarily disable online payments by setting `razorpay_enabled: false` in site settings (store gracefully falls back to Cash on Delivery).
2. **Investigate**:
   - Check `AuditLogModel` entries for `action: webhook.razorpay.*`.
   - Verify whether any order received `payment.captured` with `amountPaise < order.total`.
3. **Recover**:
   - Flag any affected orders as `pending_review` in the admin dashboard.
   - Re-enable `razorpay_enabled: true` once webhook secrets are aligned.

### Playbook C: Malicious File Upload Attempt
**Trigger**: Repeated 400 errors logged at `/api/admin/media/upload`.
1. **Contain**:
   - Ensure the server continues enforcing binary magic-byte checks.
   - If an unauthorized user attempts access, confirm `requireAdmin()` returns 401/403.
2. **Investigate**:
   - Review uploaded files in `public/uploads/products` to verify all filenames match `ttrc-prd-<timestamp>-<hash>.<ext>`.
   - Confirm no `.php`, `.html`, `.svg`, or `.exe` files exist in the uploads directory.
3. **Recover**:
   - Delete any rogue or unverified files.

---

## 3. Rate Limit Configuration Matrix

| Action / Endpoint | Rate Limit Threshold | Window | Key Identification | Fallback / Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Login** | 5 attempts | 5 minutes | `login:<email>` | 429 Error: "Too many failed login attempts." |
| **Customer Registration** | 3 registrations | 10 minutes | `register:<email>` | 429 Error: "Too many registration attempts." |
| **Coupon Verification** | 10 attempts | 1 minute | `coupon:<code>` | 429 Error: "Too many coupon check attempts." |
| **Order Placement** | 5 orders | 1 minute | `create-order:<userId>` | 429 Error: "Order creation rate limit exceeded." |
| **Product Search API** | 40 queries | 1 minute | `search:<ip>` | 429 Error: "Search rate limit exceeded." |

---

## 4. Routine Security Maintenance & Checklist

- [ ] **Weekly**: Run `node scripts/securityAudit.mjs` to confirm automated control compliance.
- [ ] **Monthly**: Run `pnpm audit` to identify and patch new CVEs in third-party packages.
- [ ] **Quarterly**: Review admin and staff account rosters in `/admin/customers` and demote inactive accounts.
- [ ] **Pre-Deployment**: Ensure `NODE_ENV === 'production'`, test bypass cookies are locked out, and no mock data exists in the production runtime.
