# TTRC Store — Secret & Credential Rotation Runbook
**Platform:** TTRC Store (`ttrc.store`)  
**Scope:** Operator Runbook for Production Secret Management & Rotation  
**Target Services:** MongoDB Atlas, Razorpay, Resend, Vercel, Supabase (if used), JWT  
**Date:** October 17, 2026

---

## 1. Overview & Operator Responsibility

During the Phase 1 Security Discovery audit, database credentials for MongoDB Atlas user `ttrcstoree_db_user` were discovered embedded in `apps/web/src/lib/mongodb/client.ts`. While the application source code has been remediated to eliminate all hardcoded credentials, **credentials exposed in Git history remain compromised until rotated at the provider level**.

This runbook provides step-by-step procedures for safely rotating all production credentials without disrupting active customer shopping, checkout, or order fulfillment.

---

## 2. Immediate Action: Rotating MongoDB Atlas Database Credentials

### Step 1: Create a Replacement Database User in MongoDB Atlas (Least-Privilege Principle)
1. Log in to the [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Navigate to **Security** -> **Database Access**.
3. Click **Add New Database User**:
   - **Authentication Method:** Password (`SCRAM-SHA-256`)
   - **Username:** `ttrc_app_user_v2` (or similar distinctive name)
   - **Password:** Click *Autogenerate Secure Password* (min 32 characters). Copy this securely to an encrypted password manager. Never paste into chat, logs, or reports.
   - **Database User Privileges (Least Privilege):** Under *Specific Privileges*, select **Add Specific Privilege** -> Database: `ttrc_store`, Collection: `*` (All Collections), Role: `readWrite`. 
     *Security Note:* Do NOT grant cluster-wide admin or access to other databases.
4. Click **Add User**.

### Step 2: Update the Environment Variable in Vercel Across Environments
1. Log in to the [Vercel Dashboard](https://vercel.com/) and navigate to the `ttrc-store` project.
2. Go to **Settings** -> **Environment Variables**.
3. Update `MONGODB_URI` across the appropriate environments (**Production**, **Preview**, and **Development**):
   ```bash
   MONGODB_URI=mongodb+srv://ttrc_app_user_v2:<ENCODED_PASSWORD>@<your-cluster>.mongodb.net/ttrc_store?retryWrites=true&w=majority
   ```
   > [!IMPORTANT]
   > **Special Character Encoding:** If the generated password contains special characters (such as `@`, `:`, `/`, `?`, `#`, `[`, `]`), they must be properly URL-encoded (e.g. `@` becomes `%40`) to prevent connection URI parse failures. Preserve your actual cluster address, database name (`ttrc_store`), and connection query parameters.
4. Redeploy the affected deployments in Vercel and verify that the build succeeds without connection errors.

### Step 3: Test and Verify Database Connectivity with Test Fixtures
1. Check function runtime logs in Vercel to confirm the application connects successfully to `ttrc_store`.
2. Run automated read/write tests against isolated test documents:
   ```bash
   pnpm test
   ```
3. Verify that product queries, category loads, and cart updates function normally.

### Step 4: Revoke and Delete the Compromised Atlas User
1. Return to **MongoDB Atlas** -> **Security** -> **Database Access**.
2. Locate the old compromised user `ttrcstoree_db_user`.
3. Click **Actions (...)** -> **Delete** to revoke the old credentials permanently.
4. Verify from an external shell that connecting with the old credentials now fails with `AuthenticationFailed`.

---

## 3. Rotating Razorpay Payment Credentials (When Activating Live Payments)

When transitioning from COD-only mode to live payments, or if keys are suspected of compromise:

> [!CAUTION]
> **Use Test-Mode First:** Do not perform real-money test transactions with personal bank accounts or cards until test-mode integration has passed. Validate refunds and payment state transitions in Razorpay Test Mode first.

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** -> **API Keys**.
3. Click **Generate New Key**:
   - Razorpay provides a grace period (e.g., 24 hours) during which both the old and new keys remain valid.
4. Copy the new **Key ID** and **Key Secret**.
5. Update Vercel Environment Variables:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_[NEW_KEY_ID]`
   - `RAZORPAY_KEY_SECRET=[NEW_KEY_SECRET]`
6. Navigate to **Settings** -> **Webhooks**:
   - Update the webhook secret and set `RAZORPAY_WEBHOOK_SECRET=[NEW_SECRET]`.
7. Redeploy the application.
8. Perform one ₹1.00 test order using a real UPI ID and confirm signature validation passes.
9. In Razorpay Dashboard, deactivate the old key after grace period confirmation.

---

## 4. Rotating Resend API Key

1. Log in to [Resend Dashboard](https://resend.com/).
2. Go to **API Keys** -> **Create API Key**.
   - **Permission:** Sending access only.
3. Copy the new key `re_...`.
4. Update Vercel:
   - `RESEND_API_KEY=re_[NEW_KEY]`
5. Send a sample email verification OTP to a test mailbox and verify delivery.
6. Delete the old API key in the Resend console.

---

## 5. Rotating JWT Session Secret (`JWT_SECRET`)

> [!WARNING]
> Rotating `JWT_SECRET` will immediately invalidate all active customer and admin session cookies, requiring all users to log in again. Schedule during low-traffic maintenance windows.

1. Generate a high-entropy 64-character hex secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update Vercel:
   - `JWT_SECRET=[NEW_HEX_SECRET]`
3. Deploy to production.
4. Verify that logging in with an existing user creates a valid session and that old sessions are rejected.

---

## 6. Git History Scrubbing (Optional but Recommended)

To purge exposed credential history from Git:
1. Ensure the user password is already rotated in MongoDB Atlas (Step 1 above). **Rotation is 100% effective even before Git scrubbing.**
2. To scrub the commit history:
   ```bash
   # Using git-filter-repo or BFG Repo-Cleaner:
   bfg --replace-text banned_passwords.txt
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```
3. Force-push to main after team coordination.
