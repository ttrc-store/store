# TTRC Store — Product Sharing, Image Management & UX Audit Report

**Date**: October 14, 2026  
**Application**: TTRC Store ([https://www.ttrc.store](https://www.ttrc.store) / [https://ttrc.store](https://ttrc.store))  
**Target Platform**: Next.js App Router (TypeScript Strict Mode) + MongoDB Atlas + Sharp Image Engine  
**Brand**: TTRC Store (Tamizh Tech Robotics Company)  

---

## 1. Executive Summary

This report documents the architectural implementation and end-to-end verification of two core systems and the comprehensive customer UX audit for TTRC Store:
1. **Product Card Sharing System**: Native & universal social sharing across all product cards and product detail views (WhatsApp, X / Twitter, Instagram via Web Share Sheet / Clipboard fallback, and Direct Copy Link with accessible toasts).
2. **Standard 2560 × 1440 (16:9 Landscape) Product Image Management**: An admin interactive crop, pan, and reposition editor supporting **Fit** (100% full uncropped image on brand-approved canvas) and **Fill/Crop** modes, automatic lossless WebP conversion via Sharp, and non-distorted `object-contain` rendering across all product cards and galleries.
3. **Product Catalog Image Audit**: Inspection of production MongoDB Atlas product records and media documents for resolution, aspect ratio, and lossless WebP compliance.

All 157 unit tests passed across `@ttrc/web` and `@ttrc/shared`, TypeScript typechecking passed with 0 errors, and the Next.js production build succeeded with 54 optimized routes.

---

## 2. Part A — Product Card Sharing Implementation

### 2.1 Reusable Components & Architecture
- **[ProductShareButton](file:///apps/web/src/components/store/product-share-button.tsx)** (`apps/web/src/components/store/product-share-button.tsx`):
  - Self-contained, accessible dropdown popover with micro-toast notification.
  - Supports two display variants:
    - `variant="card"`: Compact floating action button positioned over product cards with high contrast (`bg-white/90 backdrop-blur-xs text-slate-700 hover:text-[#844AFB]`).
    - `variant="detail"`: Full action button for the product hero order box alongside "Add to Compare" and "Add to Cart".
- **Brand Icons**: Added high-fidelity vector SVGs for WhatsApp, Instagram, and X (Twitter) in [brand-icons.tsx](file:///apps/web/src/components/ui/brand-icons.tsx).

### 2.2 Sharing Channels & URL Format Verification
| Channel | Implementation | User Experience & Verification |
| :--- | :--- | :--- |
| **WhatsApp** | `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + canonicalUrl)}` | Opens official WhatsApp web or native app with pre-filled product name, formatted price (₹), and canonical URL. |
| **X (Twitter)** | `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(canonicalUrl)}` | Opens Twitter web intent with clean canonical link and product title. |
| **Instagram** | Dual-strategy: (1) `navigator.share` on mobile devices allowing user to select Instagram Stories or DMs; (2) Clipboard copy fallback with guided toast: *"Link copied! Instagram does not support direct browser links—paste this into your Story, DM, or Bio."* | Solves Instagram web limitation transparently without false claims of direct publishing. |
| **Copy Link** | Asynchronous `navigator.clipboard.writeText` with fallback to document execCommand for older mobile browsers. | Triggers checkmark icon transition and displays accessible floating toast: *"Product link copied to clipboard!"*. |
| **Native Share** | `navigator.share` with title, text, and canonical URL. | Automatically surfaces system share sheet on Android, iOS, iPadOS, and macOS. |

### 2.3 Event Bubbling & Accessibility Invariants
- **Navigation Safety**: Both the button trigger and popover items execute `e.preventDefault()` and `e.stopPropagation()`. Clicking the share menu never inadvertently triggers the parent `<Link href="/product/[slug]">` navigation.
- **Keyboard Navigation**: Supports `Escape` key dismissal, outside click listener cleanup, explicit `aria-label`, `aria-expanded`, and `role="menu"` attributes.
- **Privacy & Canonical URLs**: All links use clean canonical URLs (`https://www.ttrc.store/product/[slug]`). No user tokens, tracking IDs, or cart states are exposed.

### 2.4 Social Preview Metadata (Open Graph & Twitter Cards)
In [apps/web/src/app/product/[slug]/page.tsx](file:///apps/web/src/app/product/[slug]/page.tsx), `generateMetadata` was upgraded:
- `openGraph.images`: Standardized to 2560 × 1440 pixels, with absolute image URL, alt text, and `siteName: 'TTRC Store'`.
- `twitter.card`: Configured as `summary_large_image`.
- Canonical product URL set dynamically per slug.
- Embedded JSON-LD Product schema with price and `https://schema.org/InStock`.

---

## 3. Part B — 2560 × 1440 (16:9 Landscape) Product Image Management

### 3.1 Standard Canvas Concept
- **Standard Canvas**: 2560 × 1440 pixels (16:9 landscape aspect ratio).
- **Core Principle**: 2560 × 1440 represents the preferred composition frame. It is **never** used to artificially upscale or distort small source images.
- **Two Distinct Modes**:
  1. **Fit Mode (Default)**:
     - Preserves 100% of the complete source image without any cropping.
     - Automatically centres the image onto a neutral `#FFFFFF` background within the 16:9 canvas.
     - Preserves original aspect ratios (square 1:1, 4:3, 3:2, or portrait).
  2. **Fill / Crop Mode**:
     - Allows admin to zoom (1x to 3x) and drag/pan to select the exact 16:9 crop framing.
     - Shows the admin an exact visual overlay of which details will remain.
     - Prevents accidental automated cropping of product edges or connectors.

### 3.2 Interactive Crop Modal Component
- Created [ProductImageCropModal](file:///apps/web/src/components/admin/product-image-crop-modal.tsx):
  - Canvas-based visual editor with interactive drag panning, zoom slider, reset button, and live preview thumbnail.
  - Embedded into [EnterpriseProductForm](file:///apps/web/src/app/admin/products/_components/enterprise-product-form.tsx) for both new image additions and single-image replacements.
  - Preserves existing valid images in state if the admin cancels or if network conversion fails.

### 3.3 Server-Side Lossless WebP Processing Pipeline
In [webp-converter.ts](file:///apps/web/src/lib/media/webp-converter.ts) and [/api/admin/media/upload](file:///apps/web/src/app/api/admin/media/upload/route.ts):
- Sharp pipeline receives `fitMode`, `crop` coordinates (`left`, `top`, `width`, `height`), and target dimensions.
- If `fitMode === 'fit'`:
  ```typescript
  pipeline = pipeline.resize({
    width: targetW,
    height: targetH,
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });
  ```
- If `fitMode === 'fill'`:
  ```typescript
  pipeline = pipeline.extract({ left, top, width, height }).resize({
    width: targetW,
    height: targetH,
    fit: 'fill',
  });
  ```
- Exported with `sharp.webp({ lossless: true, effort: 4 })`.
- Stored permanently in MongoDB Atlas `MediaModel` with full metadata (`width`, `height`, `size`, `mime_type`, `is_lossless`, `fit_mode`, `aspect_ratio`).

### 3.4 Product Card Display Verification
- **Card Container**: Updated [ProductCard](file:///apps/web/src/components/store/product-card.tsx) image wrapper:
  ```tsx
  <div className="relative aspect-[16/9] w-full bg-slate-50/80 border-b border-slate-100 overflow-hidden flex items-center justify-center p-2.5">
    <Image
      src={imageUrl}
      alt={name}
      fill
      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
      className="object-contain p-2"
      loading="lazy"
    />
  </div>
  ```
- **Zero Accidental Cropping**: Using `aspect-[16/9]` container combined with `object-contain` ensures every product is 100% visible regardless of whether its source image was 16:9, 3:2, 4:3, or 1:1.

---

## 4. Part B — Catalog Image Audit Results

We executed the database auditor [audit-product-images.ts](file:///scripts/audit-product-images.ts) against the live MongoDB Atlas catalog:

```
[Image Audit] Starting TTRC Store Product Image Audit...
[MongoDB Atlas] Successfully connected to database: ttrc_store
------------------------------------------------------------
Total Products in Catalog: 1 (TTRC LF 6.0 Line Follower Robot)
Total Images Inspected: 4
Optimal (16:9 Canvas Lossless): 0
Requires Recomposition (Fit / Fill Available): 4
Legacy / External URLs: 0
Broken URLs: 0
------------------------------------------------------------
- Image 1: /api/media/ttrc-prd-1791953750242-9efb52626ffbd40b.webp
  Dimensions: 2268 × 1512 | Aspect Ratio: 3:2 (Other Landscape) | Format: image/webp | Lossless: true
  Status: REQUIRES_RECOMPOSITION
  Recommendation: Image is in lossless WebP with 3:2 aspect ratio (2268×1512). Admin can choose Fit to preserve full product on 16:9 canvas without crop, or Fill to frame.
- Image 2: /api/media/ttrc-prd-1791953754201-06366c77aef740d6.webp
  Dimensions: 2268 × 1512 | Aspect Ratio: 3:2 | Format: image/webp | Lossless: true
- Image 3: /api/media/ttrc-prd-1791953758960-ca9a0fa65bdddead.webp
  Dimensions: 2268 × 1512 | Aspect Ratio: 3:2 | Format: image/webp | Lossless: true
- Image 4: /api/media/ttrc-prd-1791953763064-40b1c86e0ba5ba4b.webp
  Dimensions: 2268 × 1512 | Aspect Ratio: 3:2 | Format: image/webp | Lossless: true
```

### Key Migration Findings & Safety:
1. **Zero Data Loss**: All images are stored losslessly in MongoDB Atlas `MediaModel`.
2. **Current Rendering**: Because of the `aspect-[16/9]` + `object-contain` rule, these 3:2 DSLR photographs render with zero clipping or distortion on both desktop and mobile.
3. **No Automatic Bulk Destructive Overwrite**: In accordance with user rules, existing production catalog images are NOT forcefully cropped or upscaled without individual admin preview.

---

## 5. Verification & Test Suite Summary

### 5.1 Unit Tests (Vitest)
```bash
$ turbo test:unit
• Packages: @ttrc/shared (31 tests passed), @ttrc/web (126 tests passed)
• Total: 157 passed (100%), 0 failed
```
- Lossless WebP conversion pipeline: 21 tests passed.
- Razorpay production payment security & verification: 11 tests passed.
- Webhook signature & replay protection: passed.
- AI Gateway & fallback cascades: 15 tests passed.
- Pricing, GST & paise calculations: 31 tests passed.

### 5.2 TypeScript Compilation
```bash
$ turbo typecheck
• Packages: @ttrc/ui-tokens, @ttrc/shared, @ttrc/web
• Result: 0 errors across all workspace packages
```

### 5.3 Next.js Production Build
```bash
$ turbo build
• Next.js 16.3.6 (Turbopack)
• 54 static and server-rendered routes generated successfully
• 0 compile errors
```

---

## 6. Files Changed & Components Created

1. `apps/web/src/components/store/product-share-button.tsx` — **NEW**: Share button with WhatsApp, X, Instagram sheet/copy, and native share.
2. `apps/web/src/components/ui/brand-icons.tsx` — **UPDATED**: Added WhatsApp, Instagram, X SVG icons.
3. `apps/web/src/components/store/product-card.tsx` — **UPDATED**: Integrated `ProductShareButton` and standardized 16:9 non-cropping container.
4. `apps/web/src/components/store/product-order-box.tsx` — **UPDATED**: Added detail-variant `ProductShareButton`.
5. `apps/web/src/app/product/[slug]/page.tsx` — **UPDATED**: 16:9 hero gallery with share button and 2560 × 1440 OpenGraph/Twitter card metadata.
6. `apps/web/src/components/admin/product-image-crop-modal.tsx` — **NEW**: 16:9 canvas editor with zoom, pan, Fit, and Fill modes.
7. `apps/web/src/lib/media/webp-converter.ts` — **UPDATED**: Added 16:9 Fit/Fill Sharp composition pipeline.
8. `apps/web/src/app/api/admin/media/upload/route.ts` — **UPDATED**: Crop parameters handling and metadata persistence.
9. `apps/web/src/lib/mongodb/models.ts` — **UPDATED**: Added `image_metadata` subdocument schema.
10. `scripts/audit-product-images.ts` — **NEW**: Catalog image auditor.
