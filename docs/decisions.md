# Architecture Decision Records — TTRC Store

> All decisions are logged here per project rules. Format: **Date | Decision | Rationale | Status**

---

## ADR-001 — Monorepo with Turborepo + pnpm

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** Use a `pnpm` workspace monorepo with Turborepo to manage `apps/web`, `apps/mobile`, `packages/shared`, `packages/ui-tokens`.

**Rationale:**
- Shared types/schemas/business logic (pricing, GST) in one place prevents drift between web and mobile.
- Turbo pipeline caches builds and parallelizes lint/typecheck.
- Established pattern; supported by Vercel deployment.

---

## ADR-002 — All Monetary Values Stored as Integer Paise

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** Store all money as `INTEGER` (paise) in Postgres, accept/return paise in all Edge Function APIs, format at the presentation layer using `formatRupees()` from `@ttrc/shared`.

**Rationale:**
- Floating-point arithmetic on money is unreliable (0.1 + 0.2 ≠ 0.3 in IEEE 754).
- Paise integers are lossless for Indian currency (which has only 2 decimal places).
- Prevents price manipulation bugs at the edge.

---

## ADR-003 — GST Prices Are Inclusive (MRP Convention)

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** Products display GST-inclusive prices (as is standard in Indian retail). The invoice breaks down taxable amount + GST. Both inclusive and exclusive calculations are in `pricing.ts`.

**Rationale:**
- Indian Consumer Protection Act / MRP rules require GST-inclusive display prices.
- Invoices must show taxable + GST breakdown per GST Rules 2017.

---

## ADR-004 — Business Logic in Postgres/Edge Functions, Not Next.js

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** Prices, stock checks, coupon validation, and order totals are computed by Supabase Edge Functions (Deno runtime). Next.js never computes authoritative amounts.

**Rationale:**
- Prevents price manipulation via browser DevTools / Burp Suite.
- Server is single source of truth.
- Aligns with "never trust the client" rule in project spec.

---

## ADR-005 — Dark-First Theme with Orange (#FF7A00) Accent

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** Default theme is dark (`#0A0A0B` background). Accent color is `#FF7A00` (orange) derived from TTRC branding. Light theme available via `next-themes` toggle.

**Rationale:**
- TTRC existing website uses dark/techno aesthetic.
- Orange complements the robotics/engineering brand.
- Dark mode reduces eye strain for long browsing sessions on screens.

---

## ADR-006 — Hand-Coded shadcn/ui Components (Not CLI)

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** shadcn/ui components are hand-coded with TTRC tokens rather than using the shadcn CLI (which is incompatible with Tailwind v4).

**Rationale:**
- Next.js 16.3.5 ships with Tailwind v4; shadcn CLI generates v3 code.
- Avoids version conflicts and gives full control over component tokens.
- Custom components conform to our design system without overrides.

---

## ADR-007 — Razorpay as Primary Payment Gateway

**Date:** 2026-09-20  
**Status:** Accepted (Razorpay API keys are a launch blocker — placeholder in .env.example)

**Decision:** Razorpay handles all online payments. COD (Cash on Delivery) supported for orders ≤ ₹5,000.

**Rationale:**
- Razorpay is the standard for Indian e-commerce.
- Native INR support, UPI, cards, netbanking, EMI.
- Webhook-based payment confirmation (server-side verification).
- COD limit (₹5,000) reduces fraud exposure.

---

## ADR-008 — RLS on All Tables; Roles in Separate Table

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** Every Postgres table has RLS enabled. User roles (`customer`, `admin`, `staff`) are stored in a separate `user_roles` table — NOT in `auth.users.raw_user_meta_data`.

**Rationale:**
- `raw_user_meta_data` can be written by the client. Storing roles there enables privilege escalation.
- Separate `user_roles` table with `SECURITY DEFINER` helper functions prevents client role manipulation.

---

## ADR-009 — 42 Seed Products Across 8 Categories

**Date:** 2026-09-20  
**Status:** Accepted (Placeholder for real product data from Tamizh Tech team)

**Decision:** Seed file includes 42 realistic products with correct types, pricing, GST codes, and kit↔spare relationships. All prices are estimates — to be updated by the team before launch.

**Rationale:**
- Provides immediate visual content for UI development and testing.
- Kit↔spare compatibility relationships are pre-wired for the compatible products feature.

---

## ADR-010 — `@ttrc/shared` as Single Source of Truth for Types + Business Logic

**Date:** 2026-09-20  
**Status:** Accepted

**Decision:** All TypeScript types, Zod schemas, and business logic (pricing, shipping, constants) live in `packages/shared` and are imported by both web and mobile.

**Rationale:**
- Prevents type drift between platforms.
- Pricing and GST logic is tested once (unit tests in `packages/shared`).
- Business logic changes propagate to both platforms via pnpm workspace.

---

## Open TODOs (Must Resolve Before Launch)

| # | Item | Owner |
|---|------|--------|
| 1 | Replace `PLACEHOLDER_GSTIN` in `constants.ts` and `seed.sql` | Business |
| 2 | Replace Razorpay Key ID/Secret in `.env.example` | Business |
| 3 | Set real business address + phone + grievance officer name | Business |
| 4 | Upload real product images to Supabase Storage + update URLs | Design/Tech |
| 5 | Verify product prices and MRP with Tamizh Tech catalogue | Business |
| 6 | Get DPIIT certificate for GST exemption verification | Business |
| 7 | Complete Shiprocket/Delhivery integration (Phase 4) | Tech |
| 8 | Add Sentry error tracking (Phase 6) | Tech |
| 9 | Register mobile app on Play Store / App Store (Phase 8) | Business |
