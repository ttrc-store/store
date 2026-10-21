# TTRC STORE — AI-Powered Discoverability & Search Growth System
**Platform:** [https://www.ttrc.store](https://www.ttrc.store)  
**Company:** Tamizh Tech Robotics Company (TTRC), Coimbatore, Tamil Nadu, India  
**Target Launch Date:** October 22, 2026  
**Status:** Implementation Complete — Operational Release Gate Pending Verification  

---

## 1. System Overview & Evidence Level Definitions

This document specifies the technical discoverability, Answer Engine Optimization (AEO), and Google Search Console (GSC) integration architecture for TTRC Store.

### Evidence Levels Distinctions
- **Document-Supported**: Concrete architectural requirements and verified code structures in the repository.
- **Operational Verification Required**: Features requiring active external service credentials, production domain verification, or live crawler activity to produce authenticated telemetry.
- **Strict Guardrail / Correction**: Rules enforcing factual accuracy, accurate structured data, and prevention of unsupported claims.

---

## 2. Technical Grounding & Product Specification Integrity

> [!IMPORTANT]
> **Finding 1 Resolution — Zero Hallucination Hardware Protocol**:
> Technical specifications, pinouts, voltages, and MCU ratings must never be generated from general assumptions or marketing buzzwords (e.g. "enterprise", "heavy-duty"). All technical claims must originate from approved manufacturer datasheets or verified internal laboratory testing.

### Editorial & Technical Rules
1. **Authoritative Specification Sourcing**: Technical answers on voltage, stall current, torque, and MCU capabilities must match datasheet specifications.
2. **Missing Specification Gaps**: When a hardware attribute is not present in the verified input, the AI system and the Admin UI must flag it as `"Specification not verified"` and require administrator input.
3. **No Fabricated Compatibility**: A motor driver must never be claimed compatible with a motor or battery simply because hobbyists commonly pair them. Compatibility must be explicitly confirmed in `product_compatibility` database records.
4. **Tone & Claims**: Avoid unsubstantiated marketing language ("cheapest", "No. 1 in India"). Focus on measurable engineering metrics (e.g. `7–12V DC input`, `Dual L298N H-Bridge`, `2.4 GHz Wi-Fi / Bluetooth 5 LE`).

---

## 3. Structured Data & Search Enhancements Reality

> [!NOTE]
> **Finding 2 Resolution — Structured Data & Rich Results Policy**:
> Per Google Search Central guidelines (updated August 2023), `FAQPage` rich results in Google Search are generally restricted to authoritative government and health websites. Ecommerce platforms must not rely on FAQ schema as a rich-snippet ranking guarantee.

### Role of On-Page FAQs (AEO & AI Search)
- **Customer Value**: Direct, visible technical answers help robotics students, engineers, and educators make confident purchasing decisions.
- **Generative Engine Discoverability (GEO)**: Structured Q&A accordions provide clear context for conversational AI search engines (ChatGPT Search, Perplexity, Google Search AI Overviews), which extract direct answers from crawlable page text.
### Shopping Schema & Merchant Listing Specifications
Launch priority is placed on **Merchant Listing Schema** ([`apps/web/src/components/seo/json-ld.tsx`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/seo/json-ld.tsx)):
- **`Product`**: Canonical title, images, sku, and brand (`Tamizh Tech`).
- **`Offer`**:
  - **Internal vs Schema Price Units**: The database and payment pipeline store money in integer paise (e.g., `49900` paise for ₹499.00) to eliminate IEEE-754 floating-point errors. For Google Rich Results and Schema.org compliance, `Offer.price` is converted and serialized into major currency units (`price: (pricePaise / 100).toFixed(2)`), with `priceCurrency: 'INR'`.
  - **Availability & Condition**: Dynamic `https://schema.org/InStock` or `https://schema.org/OutOfStock`, with `itemCondition: 'https://schema.org/NewCondition'`.
- **`MerchantReturnPolicy` (Replacement Policy Semantics)**:
  - TTRC Store operates a **7-Day Replacement Guarantee for Defective / Transit-Damaged Components**, not a general buyer-remorse return/refund policy.
  - To prevent misleading search engine promises of cash refunds on opened electronics, the schema uses:
    - `returnPolicyCategory`: `'https://schema.org/MerchantReturnFiniteReturnWindow'`
    - `merchantReturnDays`: `7`
    - `returnMethod`: `'https://schema.org/ReturnByMail'`
    - `returnFees`: `'https://schema.org/FreeReturn'`
    - `refundType`: `'https://schema.org/ExchangeRefund'` (explicitly denotes unit replacement/exchange rather than cash refund)
    - `merchantReturnLink`: `'https://www.ttrc.store/return-refund-policy'`
- **`OfferShippingDetails` (Handling vs. Transit Time Semantics)**:
  - Google distinguishes between dispatch/handling time and courier transit time in `ShippingDeliveryTime`. These consecutive intervals must not be conflated:
    - **Handling Time**: 1 to 10 business days for engineering functional bench testing, inspection, and anti-static packaging from our warehouse in Coimbatore, Tamil Nadu (`minValue: 1, maxValue: 10, unitCode: 'd'`).
    - **Transit Time**: 2 to 7 business days pan-India courier transit post-dispatch (`minValue: 2, maxValue: 7, unitCode: 'd'`).
    - **Total Fulfilment Estimate**: 3 to 17 business days depending on recipient PIN code. The store does not advertise "delivery within 10 days", as 10 days represents the maximum dispatch/handling guarantee.
- **`BreadcrumbList`**: Hierarchical navigation trail for search snippet display.

---

## 4. Crawlability, Sitemaps & Robots Policy

> [!IMPORTANT]
> **Robots.txt vs. Access Control Architecture**:
> `robots.txt` is an advisory crawling control for compliant search engine bots; it is **NOT** a security perimeter or access control mechanism. Private customer data and administrator functions are strictly protected by server-side authentication:
> 1. **Edge Middleware** ([`apps/web/src/middleware.ts`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/middleware.ts)): Cryptographically verifies JWT HMAC SHA-256 session tokens on all `/admin/*` and `/account/*` routes, redirecting unauthenticated traffic to `/login`.
> 2. **Server Actions & Route Handlers**: Enforce role checks via `requireAdmin()` and verify `token_version` against MongoDB for instant session revocation.
> 3. **Search Page Noindex Directive**: The internal search page (`/search`) includes `<meta name="robots" content="noindex, follow">`. This allows crawlers to discover linked product pages while preventing indexation of infinite search query permutations.
> 4. **Robots Crawl Budget Directives**: Disallows crawl bots from wasting request budget on administrative and transactional endpoints (`/admin/`, `/account/`, `/cart`, `/checkout/`, `/api/`).

1. **XML Sitemap** ([`apps/web/src/app/sitemap.ts`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/sitemap.ts)):
   - Serves dynamically at `https://www.ttrc.store/sitemap.xml`.
   - **Canonical Landing Pages Only**: Internal search query pages (`/search`) are explicitly excluded per Google Search Central webmaster guidelines.
   - Includes verified canonical URLs: Homepage (`/`), Category landings (`/category/[slug]`), Canonical Products (`/product/[slug]`), and primary legal/informational pages (`/about`, `/faq`, `/contact`, `/shipping-policy`, `/return-refund-policy`, `/cancellation-policy`, `/warranty`, `/grievance-officer`, `/terms`, `/privacy-policy`).
   - Sourced with real `lastModified` timestamps derived from MongoDB `updated_at` timestamps.
2. **Robots Policy** ([`apps/web/src/app/robots.ts`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/robots.ts)):
   - Allows public storefront pages and XML feeds.
   - Disallows private administrative, auth, and transactional routes:
     - `/admin/*`, `/account/*`, `/cart`, `/checkout/*`, `/api/*`, `/design-system/*`.

---

## 5. TTRC Content Readiness Score (0–100)

The Admin Product Editor includes a transparent, normalized **100-point Content Readiness Checklist** to ensure products have complete metadata before launch.

> [!NOTE]
> This is an **internal editorial completeness score**, not a Google ranking score or search position guarantee.

| Check ID | Verification Item | Target Criteria | Points |
| :--- | :--- | :--- | :---: |
| `title` | Meta Title Length | 30–65 characters editorial target | 15 |
| `desc` | Meta Description Length | 100–165 characters editorial target | 15 |
| `primary_kw` | Primary Search Phrase | Assigned and verified against product type | 15 |
| `secondary_kw` | Secondary Keywords | At least 3 relevant, non-spammy phrases | 10 |
| `aeo_faq` | Technical FAQ Approved | At least 1 approved technical Q&A | 10 |
| `slug` | Clean URL Slug | Hyphenated, lowercase, no whitespace | 10 |
| `specs` | Technical Specifications | At least 2 verified key-value pairs | 15 |
| `images` | Product Imagery | At least 1 verified hardware image | 10 |
| **Total** | **Normalized Readiness Score** | **Complete Product Metadata** | **100** |

---

## 6. Server-Side AI Architecture & Cost Projections

### Unified AI Gateway Configuration
Located in [`apps/web/src/lib/ai/ai-gateway.ts`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/ai/ai-gateway.ts):
- **Groq** (`GROQ_API_KEY`): `llama-3.3-70b-versatile` (fastest structured output).
- **Google Gemini** (`GEMINI_API_KEY`): `gemini-2.5-flash` (native JSON schema enforcement).
- **OpenRouter** (`OPENROUTER_API_KEY`): `meta-llama/llama-3.3-70b-instruct` (tier fallback).
- **AIMLAPI** (`AIMLAPI_API_KEY`): Emergency fallback.

### Security Invariants
- **Server-Only Execution**: API keys are accessed strictly via `process.env.*` inside server actions or route handlers. Never bundled into client JS or browser payloads.
- **Admin Authorization**: All generation endpoints require authenticated admin sessions (`requireAdmin`).
- **Resilient Fallback**: If an AI provider experiences rate-limiting (429) or timeouts, the gateway cascades to the next healthy provider. If all providers fail, the admin can always enter and save metadata manually.

### Cost Projections (Estimates Based on Token Usage)
*Actual costs depend on final prompt token length and network retries:*
- **Groq Llama-3.3-70b**: ~$0.59 / 1M input, ~$0.79 / 1M output ($\approx$ ₹0.09 per product).
- **Gemini 2.5 Flash**: ~$0.075 / 1M input, ~$0.30 / 1M output ($\approx$ ₹0.03 per product).
- **OpenRouter**: ~$0.60 / 1M input, ~$0.80 / 1M output ($\approx$ ₹0.10 per product).
- Catalog of 100 products: estimated ₹3.50 – ₹10.00 total on-demand generation cost.

---

## 7. Google Search Console Setup & Operational Verification

### Step 1: Production Domain Ownership Verification
- **HTML Meta Tag**: Embedded in `<head>` via [`apps/web/src/app/layout.tsx`](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/layout.tsx).
- **DNS TXT Record**: Add `google-site-verification=...` on `ttrc.store` DNS.

### Step 2: Sitemaps Submission
Submit `https://www.ttrc.store/sitemap.xml` directly in Google Search Console once DNS propagation is complete.

### Step 3: GSC API Service Account (Optional Live Telemetry)
To display live impressions and click data in `/admin/seo`:
1. Create a Google Cloud project and enable the **Google Search Console API**.
2. Create a Service Account and grant it **Restricted User** permission on the `https://www.ttrc.store` property.
3. Configure environment variables (server-only):
   ```bash
   GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=service-account@ttrc-store-gsc.iam.gserviceaccount.com
   GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```
4. **Graceful Fallback**: If GSC environment variables are missing or unverified, `/admin/seo` displays sample/pending status indicators, never fabricating telemetry.

---

## 8. October 22, 2026 Release Verification Checklist & Evidence Gate

This release gate records actual, verifiable evidence before public launch traffic is directed to the store.

### Evidence-Based Launch Gate Table

| Gate Category | Verification Requirement | Code & System Evidence | Status |
| :--- | :--- | :--- | :---: |
| **1. Production & Build** | Clean build and typecheck; automated unit and security test suites passing. | `pnpm --filter web typecheck` passed (0 errors); Vitest suite passed 18/18 test suites, 239/239 unit & security tests. | **VERIFIED** |
| **2. Product Data & Pricing** | Major currency unit in JSON-LD; integer paise in DB; GST display matches store setting. | Internal DB stores integer paise (`49900`); `ProductJsonLd` serializes `price: (pricePaise / 100).toFixed(2)` (`499.00`); Storefront & cart omit GST addition when `gst_enabled=false`. | **VERIFIED** |
| **3. Structured Data** | Compliant Schema.org Merchant Listing; replacement policy semantics; exact shipping intervals. | `Offer.price` in INR major units; `MerchantReturnPolicy` specifies `refundType: "ExchangeRefund"` linking to `/return-refund-policy`; `OfferShippingDetails` specifies `handlingTime` (1–10d) + `transitTime` (2–7d). | **VERIFIED** |
| **4. Crawlability** | Clean canonical routes; sitemap contains only indexable canonical landing pages; crawl budget protected. | `/search` excluded from XML sitemap; `/search` carries `<meta name="robots" content="noindex, follow">`; `/return-refund-policy` canonical path fixed; `robots.txt` disallows private administrative routes. | **VERIFIED** |
| **5. Security & Access Control** | Server-side authentication and authorization on private routes; AI keys protected. | Edge Middleware (`middleware.ts`) and `requireAdmin` guard `/admin/*` and `/account/*`; AI endpoints reject unauthenticated calls with 401/403; API keys isolated to server `process.env`. | **VERIFIED** |
| **6. Search Console** | Production domain property verification; authenticated telemetry distinguished from pending state. | Domain verification tag configured in `layout.tsx`; API telemetry gracefully renders pending placeholder without fabricated data when service account is not yet linked. | **PENDING LIVE AUTH** |
| **7. Approval Workflow** | AI-generated product content remains draft until administrator review and manual publish. | `enterprise-product-form.tsx` populates editable draft form fields; requires explicit admin form submission to persist to MongoDB catalog. | **VERIFIED** |

---

### Verification Sign-off Log

```text
[Release Gate Verification Run — October 22, 2026 Production Candidate]
✓ Typecheck: pnpm --filter web typecheck (0 errors)
✓ Unit & Security Tests: 19 passed (19 files), 251 passed (251 tests)
✓ Next.js Production Build: next build (85/85 static & ISR pages prerendered successfully)
✓ JSON-LD Offer Price: Major currency units (e.g. 499.00 INR)
✓ Replacement Schema: refundType: ExchangeRefund, merchantReturnLink: /return-refund-policy
✓ Shipping Semantics: handlingTime 1-10d, transitTime 2-7d (3-17d total fulfillment window)
✓ Search Page Crawlability: robots noindex, follow; excluded from sitemap.xml
✓ Edge Auth: HMAC SHA-256 JWT verification on /admin and /account routes
```
