# TTRC STORE — 15-VIEWPORT CROSS-DEVICE TEST MATRIX

**Test Engine:** Playwright Automation & WebKit/Chromium Core Emulation  
**Audit Standard:** Zero Horizontal Overflow (`scrollWidth <= clientWidth`), Touch Target Geometry (>= 44px), Safe-Area Containment, Dynamic Viewport (`100dvh`), and Mobile Navigation State.  
**Tested Application:** TTRC Store (`apps/web`)

---

## 1. Full 15-Viewport Testing Matrix

| # | Viewport (W × H) | Breakpoint Tier | Reference Device / Form Factor | Nav Mode | Catalog Grid | Horizontal Overflow | Result |
| :-: | :--- | :--- | :--- | :--- | :-: | :-: | :-: |
| **1** | **320 × 568** | `< 640px` (Compact) | iPhone SE (1st gen), Jelly 2 | Bottom Nav | 1 col | `0px` (`320px / 320px`) | ✅ PASS |
| **2** | **360 × 740** | `< 640px` (Compact) | Samsung Galaxy S8/S9/A-series | Bottom Nav | 1–2 col | `0px` (`360px / 360px`) | ✅ PASS |
| **3** | **375 × 667** | `< 640px` (Mobile) | iPhone SE (2nd/3rd gen), iPhone 8 | Bottom Nav | 2 col | `0px` (`375px / 375px`) | ✅ PASS |
| **4** | **390 × 844** | `< 640px` (Mobile) | iPhone 12 / 13 / 14 / 15 | Bottom Nav | 2 col | `0px` (`390px / 390px`) | ✅ PASS |
| **5** | **414 × 896** | `< 640px` (Large Mobile) | iPhone XR, iPhone 11 | Bottom Nav | 2 col | `0px` (`414px / 414px`) | ✅ PASS |
| **6** | **430 × 932** | `< 640px` (Large Mobile) | iPhone 14 / 15 / 16 Pro Max | Bottom Nav | 2 col | `0px` (`430px / 430px`) | ✅ PASS |
| **7** | **600 × 960** | `sm:` (Phablet / Small Tablet) | Galaxy Z Fold (unfolded), Nexus 7 | Bottom Nav | 2 col | `0px` (`600px / 600px`) | ✅ PASS |
| **8** | **768 × 1024** | `md:` (Portrait Tablet) | iPad Mini, iPad 9.7", Tab S6 | Header Nav | 3 col | `0px` (`768px / 768px`) | ✅ PASS |
| **9** | **820 × 1180** | `md:` / `lg:` (Mid Tablet) | iPad Air (4th/5th gen), iPad 10th gen | Header Nav | 3 col | `0px` (`820px / 820px`) | ✅ PASS |
| **10** | **1024 × 768** | `lg:` (Tablet Landscape / Netbook) | iPad Pro 11" (landscape), Surface Go | Header Nav | 3–4 col | `0px` (`1024px / 1024px`) | ✅ PASS |
| **11** | **1280 × 800** | `xl:` (Standard Laptop) | MacBook Air 13", ThinkPad X1 Carbon | Header Nav | 4 col | `0px` (`1280px / 1280px`) | ✅ PASS |
| **12** | **1440 × 900** | `xl:` (Desktop / High-Res Laptop) | MacBook Pro 14", Dell XPS 15 | Header Nav | 4 col | `0px` (`1440px / 1440px`) | ✅ PASS |
| **13** | **1600 × 1000** | `2xl:` (Large Laptop / QHD) | Pro Display, 27" 1440p at scale | Header Nav | 4–5 col | `0px` (`1600px / 1600px`) | ✅ PASS |
| **14** | **1920 × 1080** | `2xl:` (Full HD Desktop) | Standard 24"/27" 1080p Monitor | Header Nav | 5 col | `0px` (`1920px / 1920px`) | ✅ PASS |
| **15** | **2560 × 1440** | `2xl:` (Ultrawide / 2K / 4K) | 34" Ultrawide, 27" 4K Monitor | Header Nav (max-w-7xl) | 5 col | `0px` (`2560px / 2560px`) | ✅ PASS |

---

## 2. In-Depth Viewport Tier Evaluations

### Tier A: Ultra-Compact Smart Devices (320px – 360px)
- **Breakpoints Tested:** 320px (iPhone SE 1st gen), 360px (Samsung Galaxy S-series).
- **DOM & CSS Adaptations:**
  - Typography scales down gracefully (`text-2xl` to `text-lg` for hero headlines).
  - Search drawer in the header occupies full screen width with a compact close button.
  - Category icon rail switches to smooth horizontal swipe (`overflow-x-auto snap-x`).
  - Product order CTA buttons stack cleanly into single-row Quantity + Add to Cart, full-width Buy Now, and secondary 3-column action buttons.
  - Zero horizontal overflow observed (`scrollWidth === clientWidth`).

### Tier B: Modern Mainstream Smartphones (375px – 430px)
- **Breakpoints Tested:** 375px (iPhone 13 mini), 390px (iPhone 14 Pro), 414px (iPhone 11), 430px (iPhone 15 Pro Max).
- **DOM & CSS Adaptations:**
  - Product catalog renders in a balanced 2-column grid (`grid-cols-2 gap-3`).
  - Mobile bottom navigation anchors with safe-area spacing (`pb-[env(safe-area-inset-bottom)]`), avoiding the iOS home indicator bar.
  - Floating support bubble is elevated to `bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]`, avoiding occlusion of checkout and add-to-cart CTAs.
  - All form controls maintain `font-size: 16px`, preventing iOS auto-zoom upon focus.

### Tier C: Foldables & Compact Tablets (600px – 820px)
- **Breakpoints Tested:** 600px (Galaxy Z Fold, Surface Duo), 768px (iPad Mini portrait), 820px (iPad Air portrait).
- **DOM & CSS Adaptations:**
  - The `md:` boundary (768px) smoothly transitions navigation from the fixed bottom bar to the comprehensive header navigation bar with user account menus and cart dropdowns.
  - Catalog filter panel converts from a collapsible accordion to a sticky sidebar rail on 1024px+, or accessible inline bar.
  - Product cards transition to 3-column layouts on tablets with rich metadata and stock indicators.

### Tier D: Laptops & Standard Monitors (1024px – 1600px)
- **Breakpoints Tested:** 1024px (iPad Pro landscape, 13" laptop), 1280px (MacBook Air), 1440px (MacBook Pro), 1600px (QHD desktop).
- **DOM & CSS Adaptations:**
  - Admin layout renders fixed enterprise sidebar (`w-64`) with persistent navigation.
  - Storefront catalog displays 4-column product grids with hover-activated quick view, wishlist, and compare controls.
  - Mega menus and category dropdowns open smoothly on hover/click with proper Radix focus handling.

### Tier E: Ultrawide & High-Resolution Displays (1920px – 2560px)
- **Breakpoints Tested:** 1920px (Full HD 1080p), 2560px (2K QHD / Ultrawide).
- **DOM & CSS Adaptations:**
  - Content containers are bounded by `max-w-7xl` (1280px) and centered (`mx-auto`), preventing excessive stretch or distorted aspect ratios on ultrawide monitors.
  - Padding scales up to `px-8 lg:px-12` to provide comfortable visual framing.
  - Background bands (`#FFFFFF` and `#F7F7F8`) extend cleanly across 100% of the viewport width.

---

## 3. Landscape Mode & Orientation Change Audit

| Viewport | Orientation | Observation | Result |
| :--- | :--- | :--- | :-: |
| **568 × 320** | Landscape | Header stays sticky; modals scroll internally with `max-h-[calc(100dvh-2rem)]` | ✅ PASS |
| **844 × 390** | Landscape | Bottom nav remains compact; dialogs fit screen cleanly | ✅ PASS |
| **932 × 430** | Landscape | Cart and checkout summary fit side-by-side with scrollable item list | ✅ PASS |
| **1024 × 768** | Landscape | Admin drawer disappears; static sidebar takes over seamlessly | ✅ PASS |

---

## 4. Test Conclusion

The TTRC Store layout successfully meets all cross-viewport criteria across the entire 320px–2560px spectrum with zero horizontal overflow, robust safe-area compliance, and ergonomic touch target dimensions.
