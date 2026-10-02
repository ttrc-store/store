# TTRC Store: Enabling GST & Razorpay Payments Guide

This document explains step-by-step how to transition TTRC Store from **Launch Mode (COD & Bill of Supply)** to **Full Operational Mode (Razorpay Online Payments & GST Tax Invoices)** once GSTIN and Razorpay credentials become available.

---

## 1. Prerequisites Checklist

Before proceeding, ensure you have:
- [ ] Valid **GSTIN** issued by the Commercial Tax Department / GST Portal (e.g. `33AAAAA0000A1Z5`).
- [ ] Active **Razorpay Account** with Live Key ID (`rzp_live_...`) and Live Key Secret.
- [ ] Razorpay Webhook Secret generated from Razorpay Dashboard (`https://dashboard.razorpay.com/app/webhooks`).

---

## 2. Enabling Razorpay Online Payments

### Step 2.1: Add Environment Variables
Add the following keys to your Vercel Production Environment Variables (or `.env.local` for local testing):

```env
NEXT_PUBLIC_RAZORPAY_ENABLED=true
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_LIVE_WEBHOOK_SECRET
```

### Step 2.2: Configure Webhook in Razorpay Dashboard
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings** -> **Webhooks** -> **Add New Webhook**.
3. Set Webhook URL: `https://ttrc.store/api/webhooks/razorpay`
4. Set Secret: Paste the exact string matching `RAZORPAY_WEBHOOK_SECRET`.
5. Select Events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
6. Click **Save Webhook**.

### Step 2.3: Flip `razorpay_enabled` Flag in Admin Panel
1. Log in to `/admin` as an Admin user.
2. Go to **Settings** -> **Payment Settings**.
3. Toggle **Enable Razorpay Payments** to `ON`.
4. Click **Save Settings**.

> **Verification Test:** Visit `/checkout` with an item in cart. Confirm that **Razorpay Online Payment (UPI, Cards, NetBanking)** now appears alongside Cash on Delivery. Place a test transaction of ₹1 to verify webhook signature and order capture.

---

## 3. Enabling GST Registration & Tax Invoices

### Step 3.1: Enter GSTIN & Toggle Flag in Admin Panel
1. Log in to `/admin` as an Admin user.
2. Go to **Settings** -> **Store & Tax Settings**.
3. Enter your 15-digit GSTIN (e.g., `33AAAAA0000A1Z5`) in the **GSTIN** field.
4. Toggle **Enable GST Invoicing** to `ON`.
5. Click **Save Settings**.

### Step 3.2: Verification of Invoices
- **New Orders:** Placed after flipping `gst_enabled = true` will automatically generate full **GST Tax Invoices** with:
  - Header: `TAX INVOICE`
  - Sequential Invoice Number: `TTRC/25-26/000123`
  - HSN code column and Taxable / CGST / SGST / IGST tax split based on customer state code.
  - "Grand Total (Inclusive of GST)".
- **Past Orders:** Placed before activation will preserve their historical **Bill of Supply / Sale Receipt** state (no retro-active tax modification).

---

## 4. Verification Checklist

- [ ] Place 1 test order with Razorpay UPI/Card (₹1 value).
- [ ] Confirm Webhook received and status changes from `pending` to `paid`.
- [ ] Download invoice from order tracking `/orders/[id]` and verify tax split.
- [ ] Test 1 full refund via Admin panel order view.
- [ ] Confirm refund reflects in Razorpay Dashboard and customer order history.
