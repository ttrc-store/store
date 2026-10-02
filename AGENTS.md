LAUNCH WITHOUT GST REGISTRATION AND WITHOUT RAZORPAY (BUILD NOW, ENABLE LATER)
We do not yet have a GSTIN or Razorpay API keys. Build every feature fully, but gate GST and Razorpay
behind site_settings so the moment we add real credentials, nothing needs to be rebuilt — only a setting
flipped and env vars added.

- site_settings gets two flags: gst_enabled (boolean, default false) and razorpay_enabled (boolean, default false).
- GST math (CGST/SGST/IGST, gst_percent per product, HSN codes) is fully implemented and stored on every product
  and order line from day one, so historical data is correct once we switch it on. While gst_enabled is false:
  the storefront displays prices as normal (no GST breakdown line, no "inclusive of GST" text), the invoice PDF
  is generated as a plain "Bill of Supply / Sale Receipt" (no GSTIN, no tax split, sequential receipt number
  instead of a tax invoice number), and the Store Settings GSTIN field is present but shows a clear
  "Not yet registered — add GSTIN here when available" placeholder that blocks GST activation until filled.
  When gst_enabled is flipped true and a valid GSTIN is entered, invoices automatically switch to full GST
  tax invoices with no code change needed.
- Razorpay is fully integrated (order creation, checkout, webhook, signature verification, refunds) but reads
  keys from env vars that do not exist yet. While razorpay_enabled is false OR the Razorpay env vars are absent:
  Cash on Delivery is the ONLY payment method shown at checkout (remove the online-payment option from the UI
  entirely, don't just disable the button), and the checkout, order and admin code paths work correctly in this
  COD-only mode with no errors or dead UI. Add a startup check that logs a clear warning (not a crash) if
  razorpay_enabled is true but keys are missing, and automatically falls back to COD-only.
  When we add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET to env and flip razorpay_enabled
  true, online payment must appear at checkout with no code change needed.
- Document this in docs/ENABLING_GST_AND_RAZORPAY.md: exact steps to add the GSTIN, exact steps to add
  Razorpay keys and the webhook URL, and what to test after each (one test order, one refund).
- Do NOT block any other phase on missing GST/Razorpay credentials. Build admin, catalog, cart, COD checkout,
  shipping, security, SEO and legal pages fully now. Launch in COD-only mode is an acceptable real launch state.
- Adjust the Part D pre-launch checklist: the live-Razorpay-payment and GST-invoice checklist items are marked
  "Deferred — enable via docs/ENABLING_GST_AND_RAZORPAY.md when credentials are available" rather than blocking launch.

PROJECT: TTRC Store (ttrc.store)
A production e-commerce store selling robotics and electronics products in India.
Company: Tamizh Tech (tamizhtech.in), Tamil Nadu. Store only: no blog, no services pages.
Goal: a secure, fast, SEO-friendly store ready for public launch with real payments.

MARKET RULES
- Currency INR (₹). Store all money as integer paise in the database. Format only in the UI.
- Listed prices are GST-inclusive. Each product has a gst_percent and an hsn_code.
- Invoices: intra-state (Tamil Nadu) = CGST + SGST; inter-state = IGST.
  Sequential invoice numbers per financial year (e.g. TTRC/25-26/000123).
- Delivery within India only. Pincode serviceability check on the product page and at checkout.
- Payments: Razorpay (UPI, cards, netbanking, wallets) + Cash on Delivery (with configurable limit and COD fee).
- Compliance to build in: Privacy Policy (India DPDP Act 2023), Terms, Shipping, Return/Refund,
  Cancellation policy, Grievance Officer contact (Consumer Protection E-Commerce Rules 2020),
  seller details and GSTIN in the footer, country of origin field on products.

TECH STACK (do not substitute without asking)
- Next.js (latest stable, App Router) + TypeScript strict mode
- Tailwind CSS + shadcn/ui + Lucide icons
- Supabase: Postgres, Auth, Storage, Edge Functions, Row Level Security
- Razorpay for payments, Shiprocket for shipping (with a manual-tracking fallback)
- Resend for transactional email, Sentry for errors, GA4 + Vercel Analytics
- Zod + react-hook-form for validation, TanStack Query for client data, Zustand for cart state
- Vitest (unit) + Playwright (e2e), GitHub Actions CI, Vercel hosting
- Package manager: pnpm

BRAND (from the supplied logo: public/brand/ttrc-logo.png)
- The logo itself is a black background with metallic silver/white italic "TT", an orange-gradient "R",
  a silver "C" containing an orange shopping cart, and a wide-spaced "STORE" wordmark with an orange glow line.
  Do not redraw or alter the logo. It is used only on dark surfaces (header bar, footer, favicon) as a lockup;
  it does NOT define the site's overall theme, which is now white + red (see below).
- PLATFORM THEME UPDATE — the entire platform (storefront and admin) is now WHITE + RED, replacing the earlier
  black/orange concept. This supersedes any earlier black/orange palette instruction in this file.
  --ttrc-white #FFFFFF (primary background, used generously — most of every page is white),
  --ttrc-off-white #F7F7F8 (section backgrounds, card backgrounds, subtle zebra striping),
  --ttrc-ink #14141A (primary text, near-black not pure black, for a cleaner print-like read),
  --ttrc-grey #6B7280 (secondary text, captions, metadata), --ttrc-line #E5E7EB (borders, dividers),
  --ttrc-red #E3132A (primary/highlight — buttons, links, active nav, prices on sale, badges, focus rings),
  --ttrc-red-dark #B80F21 (hover/pressed state for red elements), --ttrc-red-tint #FDECEE (light red backgrounds
  for banners, sale tags, subtle highlight fills). Red is the ONLY accent colour anywhere in the platform.
  No blue, green, orange, purple anywhere except a small desaturated status dot in the admin panel
  (e.g. a stock-out badge or a destructive delete confirmation) — never on the storefront or on any
  customer-facing button, which must stay white/ink/red. The header and footer may still use dark ink/black
  as a background band (to host the logo correctly, matching onlyscrews.in's dark header on a light site),
  but the body of every page is white-first, dense, and commerce-forward like the reference site.
- Reference for overall feel: https://onlyscrews.in — study it for site structure, not colour: a slim rotating
  announcement/offer bar above the header, a dense icon-based "Shop by category" grid, horizontal "Frequently bought"
  product rails, a "Trusted by" logo strip, a customer reviews carousel, a floating WhatsApp support button, a
  bulk/institution enquiry form (schools and STEM labs), and a footer with newsletter signup and policy links.
- Typography: "Rajdhani" or "Exo 2" for headings, "Inter" for body.
- Motion: subtle red glow/underline on primary buttons, links and focus rings, smooth hovers, skeleton loaders.
  Respect prefers-reduced-motion.

CATEGORY STRUCTURE
1. Gamified Robots: Robo Race, Line Follower, Robo Soccer (each has "Kits" and "Spare Parts" tabs)
2. STEM Kits
3. Fasteners (screws, nuts, bolts, standoffs, spacers)
4. Batteries (LiPo, Li-ion, NiMH, chargers, holders)
5. Motors (DC, BO, servo, stepper, BLDC, motor drivers)
6. Sensors (IR, ultrasonic, IMU/gyro, colour, line sensor arrays)
7. Drones (kits, frames, flight controllers, props, ESCs)
8. Wires & Connectors (jumper wires, XT60, JST, headers, cables)
Categories are data-driven (self-referencing parent_id), editable from the admin panel, never hardcoded.

NO MOCK OR DEMO PRODUCT DATA
- Never create fake products, reviews, orders, customers or banners in the app, seeds or migrations.
- Only categories, sub-categories and site settings are seeded. The store starts empty and the admin adds every product
  through the admin panel.
- Every storefront page must have a proper empty state ("No products yet") instead of placeholder content.
- Automated tests create their own temporary fixtures in a test database and clean them up afterwards.

KIT + SPARE PARTS LOGIC (core feature)
- products.product_type is one of: kit, spare_part, standard.
- Table product_compatibility(spare_part_id, kit_id) links spare parts to kits (many-to-many).
- Kit page: main product, then "Spare Parts for this Kit" as separate product cards each with its own
  Add to Cart, then a "Frequently Bought Together" bundle box (kit + selected parts, combined price, add all).
- Spare part page: "Compatible with" links back to kits.
- Robo Race / Line Follower / Robo Soccer category pages show Kits and Spare Parts tabs.

ENGINEERING RULES
- Server Components by default; Client Components only where interactivity is needed.
- All writes go through Server Actions or Route Handlers with Zod validation. Never trust client input,
  especially prices, totals and stock: always recompute the cart total on the server from database prices.
- The Supabase service-role key and the Razorpay secret are server-only. Never import them in client code.
- Every table has RLS enabled. Write policies explicitly. Default deny.
- No `any`. No unhandled promise rejections. Every async UI has loading, empty and error states.
- Accessibility: WCAG AA contrast, keyboard navigation, alt text, labelled form fields.
- Mobile first: bottom nav bar on mobile (Home, Categories, Cart, Profile). Test at 360px width.
- Performance targets: Lighthouse mobile >= 90 (Performance, SEO, Best Practices, Accessibility) on home,
  category and product pages. Use next/image, lazy loading, ISR/caching for catalog pages.
- Git: small commits, conventional messages. Keep a CHANGELOG and a /docs folder (architecture, env vars,
  runbook, admin guide).
- After each phase: run lint, typecheck, unit tests, e2e tests, and report results in the Walkthrough artifact.
- If a requirement is ambiguous or needs a credential/business decision, stop and ask. Do not invent
  legal text, GSTIN, addresses or keys: use clearly marked placeholders such as {{GSTIN}}.
