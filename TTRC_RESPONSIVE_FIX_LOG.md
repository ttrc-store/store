# TTRC STORE — RESPONSIVE DESIGN & MOBILE COMPATIBILITY FIX LOG

**Audit Date:** October 2026  
**Status:** All Fixes Applied & Verified  
**App Workspace:** `apps/web`  

---

## 1. Summary of Changes

| ID | Component / File | Problem Addressed | Resolution / Applied Pattern | Status |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | `apps/web/src/app/layout.tsx` | Missing `viewportFit: 'cover'`, preventing iOS notch safe-area calculation | Exported `viewport` with `viewportFit: 'cover'` and `maximumScale: 5` | ✅ Completed |
| **RF-02** | `apps/web/src/app/globals.css` | iOS Safari input auto-zoom on `< 16px` inputs, missing safe-area utilities | Added CSS media query for 16px inputs, safe-area utility classes, `overflow-x: clip`, and `100dvh` | ✅ Completed |
| **RF-03** | `apps/web/src/components/layout/storefront-client-shell.tsx` | Main content overlapped mobile bottom nav on notched phones | Added dynamic padding `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0` | ✅ Completed |
| **RF-04** | `apps/web/src/components/layout/mobile-bottom-nav.tsx` | Bottom navigation bar clashed with iOS Home Indicator; missing ARIA attributes | Dynamic height `h-[calc(4rem+env(safe-area-inset-bottom,0px))]`, `aria-label`, and `aria-current="page"` | ✅ Completed |
| **RF-05** | `apps/web/src/components/support/store-support-chat.tsx` | Support bubble overlapped bottom nav; input caused iOS auto-zoom | Positioned at `bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]`, `text-base` input, `max-h-[calc(100dvh-7rem)]` | ✅ Completed |
| **RF-06** | `apps/web/src/components/layout/cookie-banner.tsx` | Cookie banner obscured mobile bottom nav | Safe-area offset `bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]` | ✅ Completed |
| **RF-07** | `apps/web/src/components/layout/footer.tsx` | Trust badges and footer links cramped on 320px–480px viewports | Responsive grid `grid-cols-1 sm:grid-cols-2 md:grid-cols-4/5`, safe-area bottom offset | ✅ Completed |
| **RF-08** | `apps/web/src/components/layout/header.tsx` | Logo overflow on small screens; mobile search lacked live autocomplete | Responsive logo `h-7 sm:h-9`, mobile search suggestions with keyboard navigation, 16px search input | ✅ Completed |
| **RF-09** | `apps/web/src/components/admin/admin-shell.tsx` | Admin panel rendered static 256px sidebar side-by-side on mobile, breaking layout | Built responsive drawer for `< md` with hamburger button in header, focus trap, and backdrop | ✅ Completed |
| **RF-10** | `apps/web/src/app/admin/layout.tsx` | Connected root admin layout to `AdminShell` | Wrapped admin pages inside `AdminShell` | ✅ Completed |
| **RF-11** | `apps/web/src/components/account/account-nav.tsx` | Vertical menu pushed account content 300px+ down on mobile | Converted to horizontal scrollable tab pills on `< lg`, vertical on `lg:` | ✅ Completed |
| **RF-12** | `apps/web/src/components/store/catalog-filter-bar.tsx` | Filter cards pushed product listings below the mobile fold | Added collapsible accordion toggle on mobile with active filter badges | ✅ Completed |
| **RF-13** | `apps/web/src/components/ui/dialog.tsx` | Modals overflowed screen in mobile landscape orientation | Set `w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto` | ✅ Completed |
| **RF-14** | `apps/web/src/components/ui/input.tsx` | Default input text size was 14px, triggering iOS auto-zoom | Changed base font to `text-base sm:text-sm` | ✅ Completed |
| **RF-15** | `apps/web/src/components/store/product-order-box.tsx` | CTAs wrapped awkwardly; redundant closing tag caused syntax error | 3-tier action grid (Qty + Cart / Buy Now / secondary actions), removed redundant `</div>` | ✅ Completed |
| **RF-16** | Admin Modals (`categories`, `coupons`, `customers`, `orders`, `products`) | Admin modals clipped submit and delete buttons in landscape mode | Added `overflow-y-auto` on overlays and `max-h-[calc(100dvh-2rem)] overflow-y-auto` on inner modal cards | ✅ Completed |
| **RF-17** | `apps/web/tests/e2e/responsive.spec.ts` | Missing automated cross-viewport validation | Built 15-viewport Playwright test suite validating zero horizontal overflow and safe areas | ✅ Completed |

---

## 2. Detailed Code Changes & Diff Summaries

### RF-01 & RF-02: Viewport Meta, iOS Auto-Zoom Prevention & Safe Areas
**Files:** `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`
```diff
--- a/apps/web/src/app/layout.tsx
+++ b/apps/web/src/app/layout.tsx
@@ -45,7 +45,8 @@ export const viewport: Viewport = {
   width: 'device-width',
   initialScale: 1,
   maximumScale: 5,
   themeColor: '#FFFFFF',
+  viewportFit: 'cover',
 };
```
```diff
--- a/apps/web/src/app/globals.css
+++ b/apps/web/src/app/globals.css
@@ -21,6 +21,14 @@
+@media (max-width: 639px) {
+  input, select, textarea {
+    font-size: 16px !important;
+  }
+}
+
+.pt-safe { padding-top: env(safe-area-inset-top, 0px); }
+.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
+.pl-safe { padding-left: env(safe-area-inset-left, 0px); }
+.pr-safe { padding-right: env(safe-area-inset-right, 0px); }
+.mb-safe { margin-bottom: env(safe-area-inset-bottom, 0px); }
```

### RF-03 & RF-04: Mobile Bottom Nav & Shell Safe-Area Offsets
**Files:** `apps/web/src/components/layout/storefront-client-shell.tsx`, `apps/web/src/components/layout/mobile-bottom-nav.tsx`
```diff
--- a/apps/web/src/components/layout/storefront-client-shell.tsx
+++ b/apps/web/src/components/layout/storefront-client-shell.tsx
@@ -32,7 +32,7 @@ export function StorefrontClientShell({ children }: { children: React.ReactNode
-      <main className="flex-1 pb-16 md:pb-0">{children}</main>
+      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">{children}</main>
```
```diff
--- a/apps/web/src/components/layout/mobile-bottom-nav.tsx
+++ b/apps/web/src/components/layout/mobile-bottom-nav.tsx
@@ -19,7 +19,8 @@ export function MobileBottomNav() {
-    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden">
+    <nav aria-label="Mobile Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]">
```

### RF-09 & RF-10: Responsive Admin Panel Slide-Out Drawer
**Files:** `apps/web/src/components/admin/admin-shell.tsx`, `apps/web/src/app/admin/layout.tsx`
```diff
--- a/apps/web/src/app/admin/layout.tsx
+++ b/apps/web/src/app/admin/layout.tsx
@@ -1,13 +1,7 @@
-import { AdminSidebar } from '@/components/admin/admin-sidebar';
-import { AdminHeader } from '@/components/admin/admin-header';
+import { AdminShell } from '@/components/admin/admin-shell';
 
 export default function AdminLayout({ children }: { children: React.ReactNode }) {
   return (
-    <div className="min-h-screen bg-slate-50 flex">
-      <AdminSidebar />
-      <div className="flex-1 flex flex-col min-w-0">
-        <AdminHeader />
-        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
-      </div>
-    </div>
+    <AdminShell>{children}</AdminShell>
   );
 }
```

### RF-11 & RF-12: Account Nav Tabs & Catalog Filter Mobile Accordion
**Files:** `apps/web/src/components/account/account-nav.tsx`, `apps/web/src/components/store/catalog-filter-bar.tsx`
- Replaced static sidebar in `account-nav.tsx` with responsive layout:
  - `< lg`: Horizontal pill list with `overflow-x-auto gap-2 no-scrollbar`.
  - `>= lg`: Vertical card menu list.
- Added interactive toggle button to `catalog-filter-bar.tsx`:
  - Mobile button displays "Filters & Sorting" with count badge.
  - Toggles collapsed/expanded state smoothly.

### RF-13 & RF-14: Dialog Viewport Constraints & Input 16px Sizing
**Files:** `apps/web/src/components/ui/dialog.tsx`, `apps/web/src/components/ui/input.tsx`
```diff
--- a/apps/web/src/components/ui/dialog.tsx
+++ b/apps/web/src/components/ui/dialog.tsx
@@ -32,7 +32,7 @@ const DialogContent = React.forwardRef<
-        className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ...", className)}
+        className={cn("fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ...", className)}
```
```diff
--- a/apps/web/src/components/ui/input.tsx
+++ b/apps/web/src/components/ui/input.tsx
@@ -10,7 +10,7 @@ const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>
-        className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors ...", className)}
+        className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-xs transition-colors ...", className)}
```

### RF-15: Product Order Box Action Grid
**File:** `apps/web/src/components/store/product-order-box.tsx`
- Tier 1: Quantity selector with flex-1 Add to Cart button.
- Tier 2: Full-width Buy Now button with Zap icon.
- Tier 3: 3-column equal grid for AddToWishlist, AddToCompare, and ProductShareButton.
- Removed redundant closing tag on line 398.

### RF-16: Admin Modal Viewport Height Caps
**Files:** `categories/page.tsx`, `coupons/page.tsx`, `customers/page.tsx`, `admin-orders-client.tsx`, `admin-products-client.tsx`, `enterprise-product-form.tsx`
- Applied `fixed inset-0 z-50 ... overflow-y-auto` to all modal backdrops.
- Applied `max-h-[calc(100dvh-2rem)] overflow-y-auto` to modal card containers.

---

## 3. Design System Token Preservation

All fixes adhered strictly to the platform's White + Red design language:
- Primary Background: `#FFFFFF` (`--ttrc-white`)
- Secondary Surfaces: `#F7F7F8` (`--ttrc-off-white`)
- Primary Typography: `#14141A` (`--ttrc-ink`)
- Secondary Typography: `#6B7280` (`--ttrc-grey`)
- Border & Line Accents: `#E5E7EB` (`--ttrc-line`)
- Brand Highlight / CTAs: `#E3132A` (`--ttrc-red`)
- Dark Red Pressed / Hover: `#B80F21` (`--ttrc-red-dark`)
- Red Fill Tint: `#FDECEE` (`--ttrc-red-tint`)
