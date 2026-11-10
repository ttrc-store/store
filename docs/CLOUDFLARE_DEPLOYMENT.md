# Cloudflare Pages Deployment

## Overview
TTRC Store is deployed on **Cloudflare Pages** using the [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) adapter.

## Cloudflare Pages Dashboard Settings

| Setting | Value |
|---|---|
| Framework preset | None (custom) |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @ttrc/web exec next build && pnpm --filter @ttrc/web exec next-on-pages` |
| Build output directory | `apps/web/.vercel/output/static` |
| Root directory | `/` (monorepo root) |
| Node.js version | `20` |

## Environment Variables (set in Cloudflare Pages dashboard)
All env vars from `.env.example` must be set in the Cloudflare Pages dashboard under **Settings → Environment Variables**.

Key vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` (when enabled)
- `NEXT_PUBLIC_SITE_URL` = `https://www.ttrc.store`
- `NODE_ENV` = `production`

## Local Preview
```bash
cd apps/web
pnpm run preview
```

## Manual Deploy
```bash
cd apps/web
pnpm run deploy
```

## Why Cloudflare Pages (not Workers)?
- Next.js App Router SSR support via `next-on-pages`
- Edge middleware runs natively
- Free tier includes 500 builds/month and unlimited requests
- Global CDN with India PoPs (Mumbai, Chennai)

## Notes on `@vercel/analytics` / `@vercel/speed-insights`
These packages are still installed but will not report data on Cloudflare Pages (Vercel-specific infrastructure). They are harmless no-ops in this environment. Consider replacing with [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) or keeping GA4 as the primary analytics.

## Compatibility
The Next.js middleware uses Web Crypto API — fully edge-compatible with Cloudflare Workers runtime.
Node.js compatibility mode (`nodejs_compat` flag in `wrangler.toml`) covers server-side code that uses Node.js APIs.
