# TTRC Store — Frontend Design System Specification

**Project**: TTRC Store (`ttrc.store`)  
**Parent Company**: Tamizh Tech (`tamizhtech.in`)  
**Target**: Production E-Commerce Launch  
**Core Stack**: Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui + Radix UI primitives + Lucide React

---

## 1. Principles & Vision

TTRC Store is engineered as a **premium engineering e-commerce platform**, prioritizing:
1. **Product First**: Clean, dense, readable hardware hierarchy.
2. **Transparent Financials**: Server-authoritative INR (₹) prices stored in integer paise with tabular numeral alignment.
3. **Technical Precision**: Rigorous typographic distinction between commerce copy and hardware specs.
4. **Cohesive Single Product**: Seamless visual continuity across Storefront, Checkout, Account, and Admin.
5. **Speed & Accessibility**: Zero unnecessary hydration, WCAG AA compliance, and respect for `prefers-reduced-motion`.

---

## 2. Master Color Tokens

TTRC Store utilizes a focused, high-contrast palette built around Master Violet & Deep Purple accents over clean off-white canvas:

| Token Name | Hex Value | Purpose / Role |
|---|---|---|
| `--ttrc-primary` | `#844AFB` | Primary action buttons, active navigation, key highlights, focus rings |
| `--ttrc-deep` | `#6721F2` | Hover & pressed states for primary buttons, deep purple gradients |
| `--ttrc-dark` | `#1E0D45` | Dark utility bar background, newsletter backgrounds, high-contrast badges |
| `--ttrc-black` | `#050507` | Primary text (`text-[#050507]`), headings, near-black read |
| `--ttrc-background` | `#FDFDFD` | Primary site background, generous whitespace |
| `--ttrc-lavender` | `#EEE8FA` | Soft section background, secondary buttons, subtle card zebra fills |
| `--ttrc-soft-purple` | `#AF87F8` | Focus ring glow, subtle accent borders, subheaders |
| `--ttrc-gray` | `#6D6A6A` | Secondary text, captions, metadata, breadcrumb labels |

### Semantic Status Colors (Untouched by Purple)
- **Success**: `#16A34A` (In stock, payment captured, order delivered)
- **Warning**: `#D97706` (Low stock warning, pending verification)
- **Error / Destructive**: `#EF4444` (Out of stock, payment failed, order cancelled, delete actions)
- **Info**: `#2563EB` (Order in transit, informational alerts)

---

## 3. Typography Architecture

Three distinct typefaces are utilized with strict separation of responsibility:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Space Grotesk (Headings: H1, H2, Hero, Category Titles, Section Headers)│
├─────────────────────────────────────────────────────────────────────────┤
│ Plus Jakarta Sans (Commerce Body, Labels, Buttons, Navigation, Prices) │
├─────────────────────────────────────────────────────────────────────────┤
│ JetBrains Mono (Technical Only: SKU, Voltage, RPM, Dimensions, Part #)  │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Space Grotesk** (`--font-heading`):
   - Used exclusively for `h1`, `h2`, `h3`, hero statements, and category showcase headers.
   - Weight: `600` (semibold) or `700` (bold), tracking `-0.01em`.
2. **Plus Jakarta Sans** (`--font-sans`):
   - The primary UI typeface across body copy, labels, form controls, navigation, and prices.
   - Always paired with `tabular-nums` for price amounts (`₹1,299`) to prevent numeric jitter.
3. **JetBrains Mono** (`--font-mono`):
   - Restricted solely to technical hardware attributes: SKU (`TTRC-MOT-N20-6V`), voltage (`6.0V DC`), current (`1.2A`), pinouts, and code snippets.
   - Never used for standard paragraph text or marketing headlines.

---

## 4. Spacing, Radii & Grid Scale

### Spacing Scale
Consistent 4px baseline scale:
- `4px` (`space-1`), `8px` (`space-2`), `12px` (`space-3`), `16px` (`space-4`), `20px` (`space-5`), `24px` (`space-6`), `32px` (`space-8`), `40px` (`space-10`), `48px` (`space-12`), `64px` (`space-16`), `80px` (`space-20`).

### Radii Scale
- Micro (tags, pills, checks): `rounded-md` (`6px`)
- Elements (badges, dropdown items): `rounded-lg` (`8px`)
- Interactive (buttons, inputs, select triggers): `rounded-xl` (`12px`)
- Containers (cards, modals, alert boxes): `rounded-2xl` (`16px`)
- Large Sections (hero banners, newsletter): `rounded-3xl` (`24px`)

### Responsive Grid System
- **Product Grids**:
  - Desktop ($\ge 1280\text{px}$): 5–6 columns
  - Laptop ($1024\text{px} - 1279\text{px}$): 4 columns
  - Tablet ($768\text{px} - 1023\text{px}$): 3–4 columns
  - Mobile ($< 768\text{px}$): 2 columns (`grid-cols-2`)
- **Aspect Ratio**: Constant `aspect-square` for product image containers to guarantee zero layout shift (CLS = 0).

---

## 5. Standard Component Library

All components reside in `src/components/ui/` and `src/components/store/`:

### Core UI (`src/components/ui/`)
- `Button`: Standardized with `default`, `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`, `glow`.
- `Badge`: Standardized with `default`, `secondary`, `outline`, `kit`, `spare`, `success`, `warning`, `destructive`.
- `Input`: Standardized with 12px radius, `#844AFB` focus ring, and clear placeholder styling.
- `Select`: Radix-style select trigger, value, content, and item.
- `Checkbox`: Accessible checkbox with Check icon and purple focus states.
- `RadioGroup`: Accessible radio group with selected dot indicator.
- `Switch`: Smooth sliding toggle switch with 200ms transition.
- `Dialog` & `Sheet`: Accessible modal and drawer dialogs with Escape key and overlay backdrop dismissal.
- `Tabs`: Accessible tabs with active pill indicator.
- `Accordion`: Collapsible FAQ/specifications with Chevron toggle.
- `Alert`: Semantic alert cards (`default`, `destructive`, `success`, `warning`, `info`).
- `Table`: Complete table family (`TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
- `EmptyState`: Standardized empty state card with icon, title, description, and action.
- `ErrorState`: Standardized error boundary state with retry and support actions.

### Domain Components (`src/components/store/`)
- `ProductCard`: Server-rendered canonical card with image, badges, brand, title, rating, stock status, PriceDisplay, and Add to Cart link.
- `ProductGrid`: Canonical responsive grid supporting items, loading skeleton, and empty states.
- `PriceDisplay`: Canonical price presentation handling Selling Price, MRP strikethrough, Discount % badge, and unit suffix.
- `BulkPriceTable`: Tiered quantity wholesale pricing table directly fed from MongoDB catalog data.
- `SearchBar`: Canonical debounced search input with live autocomplete suggestions, image previews, and keyboard navigation.
- `TrustStrip`: Engineering hardware trust features.
- `CollectionCard`: Curated hardware category showcase cards.

### Admin Components (`src/components/admin/`)
- `AdminSidebar`: Master purple navigation bar with active indicators.
- `AdminHeader`: Admin breadcrumbs, quick search, and profile actions.
- `MetricCard`: Dashboard analytics card with trend indicators and warning highlights.
- `DataTable`: Server-backed table with client sorting, search filtering, and pagination.

---

## 6. Motion & Accessibility Standards

- **Transition Durations**: `150ms` – `250ms` (`duration-200`).
- **Allowed Transforms**: `opacity`, `transform` (`scale(1.02)`, `translateY(-1px)`).
- **Reduced Motion**: Mandatory media query `@media (prefers-reduced-motion: reduce)` resets all animations to `0.01ms`.
- **Global Focus Treatment**:
  ```css
  outline: none;
  ring: 2px solid #844AFB;
  ring-offset: 2px;
  ```
- **WCAG AA Compliance**: All text elements meet or exceed 4.5:1 contrast against `#FDFDFD` and `#FFFFFF`.
