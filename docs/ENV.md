# TTRC Store: Environment Variables Reference (`docs/ENV.md`)

This dictionary lists all required and optional environment variables for TTRC Store (`ttrc.store`).

---

## 1. Core Web App & Supabase

| Variable Name | Required | Default / Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://ttrc.store` (Base URL for canonical URLs & OG metadata) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase Publishable / Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (Server-only) | Supabase Service Role key (never expose to client) |

---

## 2. Launch Flags (GST & Payment Gateways)

| Variable Name | Required | Default / Description |
|---|---|---|
| `NEXT_PUBLIC_RAZORPAY_ENABLED` | Optional | `false` (Set `true` when Razorpay credentials available) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Razorpay Live / Test Key ID (`rzp_live_...` or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Optional (Server-only) | Razorpay Secret Key |
| `RAZORPAY_WEBHOOK_SECRET` | Optional (Server-only) | Razorpay Webhook Secret for signature validation |

---

## 3. Shipping & Logistics (Shiprocket)

| Variable Name | Required | Default / Description |
|---|---|---|
| `SHIPROCKET_API_EMAIL` | Yes | Shiprocket account email |
| `SHIPROCKET_API_PASSWORD` | Yes (Server-only) | Shiprocket account password |
| `SHIPROCKET_PICKUP_PINCODE` | Yes | `641004` (Coimbatore warehouse pincode) |

---

## 4. Email & Monitoring

| Variable Name | Required | Default / Description |
|---|---|---|
| `RESEND_API_KEY` | Yes (Server-only) | Resend API key for order confirmation & shipping emails |
| `RESEND_FROM_EMAIL` | Yes | `orders@ttrc.store` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile CAPTCHA site key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 ID (`G-XXXXXXXXXX`) |
