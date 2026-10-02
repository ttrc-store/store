# TTRC Store: Environment Variables Reference (`docs/ENV.md`)

This dictionary lists all required and optional environment variables for TTRC Store (`ttrc.store`).

---

## 1. Core Web App & MongoDB Atlas

| Variable Name | Required | Default / Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://ttrc.store` (Base URL for canonical URLs & OG metadata) |
| `MONGODB_URI` | Yes (Server-only) | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Yes (Server-only) | JWT Secret key for user session cookies |

---

## 2. Launch Flags (GST & Payment Gateways)

| Variable Name | Required | Default / Description |
|---|---|---|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Razorpay Live / Test Key ID (`rzp_live_...` or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Optional (Server-only) | Razorpay Secret Key |
| `RAZORPAY_WEBHOOK_SECRET` | Optional (Server-only) | Razorpay Webhook Secret for signature validation |

---

## 3. Shipping & Logistics (Shiprocket)

| Variable Name | Required | Default / Description |
|---|---|---|
| `SHIPROCKET_EMAIL` | Optional | Shiprocket account email |
| `SHIPROCKET_PASSWORD` | Optional (Server-only) | Shiprocket account password |

---

## 4. Email & Monitoring

| Variable Name | Required | Default / Description |
|---|---|---|
| `RESEND_API_KEY` | Optional (Server-only) | Resend API key for order confirmation & shipping emails |
| `RESEND_FROM_EMAIL` | Optional | `orders@ttrc.store` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 ID (`G-XXXXXXXXXX`) |
