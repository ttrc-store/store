# TTRC Store: Operational Runbook (`docs/RUNBOOK.md`)

This guide provides operational procedures for deploying, backing up, restoring, rolling back, and handling emergency scenarios for `ttrc.store`.

---

## 1. Production Deployment Procedure

1. **GitHub Main Branch Deployment:**
   - Push audited commits to `main`. GitHub Actions CI runs linting, strict typechecking, unit tests, and security scans.
   - Vercel automatically builds and deploys to Production environment.

2. **Database Migrations:**
   - Execute migrations against production Supabase instance using Supabase CLI:
     ```bash
     supabase db push --linked
     ```

---

## 2. Emergency Rollback Procedure

If a production build fails or contains a critical bug:
1. Open Vercel Dashboard -> `ttrc-store` Project -> **Deployments**.
2. Find the previous green deployment.
3. Click `...` -> **Promote to Production**.

---

## 3. Promoting Admin Users

To promote a newly registered user to an `admin` or `staff` role safely:
1. Open SQL Editor in Supabase Dashboard.
2. Run the documented helper script in `supabase/scripts/make_admin.sql`:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@tamizhtech.in';
   ```

---

## 4. Payment Failure & Stock Recovery

- Reserved stock for pending online orders automatically expires after 30 minutes if unpaid.
- If a customer payment is captured in Razorpay but fails to transition order status via webhook, an admin can manually update payment status in `/admin/orders/[id]` using the Razorpay Payment ID reference.
