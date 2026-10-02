# TTRC Store: System Architecture & Design Specification (`docs/ARCHITECTURE.md`)

This document outlines the architecture, data structures, and kit/spare parts logic of TTRC Store (`ttrc.store`), operated by Tamizh Tech.

---

## 1. System Overview

```
                        +----------------------------------------+
                        |      Customer / Admin Browser          |
                        +-------------------+--------------------+
                                            |
                                 HTTPS (Next.js 15 App Router)
                                            |
                                            v
                        +----------------------------------------+
                        |           Vercel Web Engine            |
                        |      (Server Components + Actions)     |
                        +----+-------------------+----------+----+
                             |                   |          |
              +--------------+         +---------+--+    +--+---------------+
              |                        |            |    |                  |
              v                        v            |    v                  v
+--------------------------+  +------------------+  | +------------+  +-----------+
|    Supabase Postgres     |  |    Shiprocket    |  | |  Razorpay  |  |  Resend   |
| (RLS + Auth + Storage)   |  | (Shipping/Pincode|  | | (Payments) |  |  (Emails) |
+--------------------------+  +------------------+  | +------------+  +-----------+
                                                    |
                                                    v
                                             +--------------+
                                             | Upstash Redis|
                                             | (Rate Limit) |
                                             +--------------+
```

---

## 2. Core Feature: Kit & Spare Parts Engine

Products are categorized into three distinct `product_type` definitions:
1. `kit`: Complete robotics assembly kits (e.g. Robo Race Chassis Kit, Line Follower Kit, Robo Soccer Bot Kit).
2. `spare_part`: Individual replacement components (e.g. N20 Motor 300RPM, 5-Channel IR Line Array, L298N Motor Driver).
3. `standard`: Standalone items, consumables, or general hardware.

### Data Relationship (`product_compatibility`)
```
+------------------+             +------------------------+             +------------------+
|   products       |             | product_compatibility  |             |   products       |
| (product_type =  | <---------- |   (kit_id,             | ----------> | (product_type =  |
|      'kit')      |             |    spare_part_id)      |             |  'spare_part')   |
+------------------+             +------------------------+             +------------------+
```

### UI Integration Points
- **Kit Detail Page:** Renders kit details, specifications, **"Spare Parts for this Kit"** product grid, and a **"Frequently Bought Together"** bundle purchasing widget.
- **Spare Part Page:** Renders **"Compatible with"** badge list with direct links back to compatible master kits.
- **Category Browsing:** Gamified robotics categories feature dedicated **"Kits"** and **"Spare Parts"** tab views.

---

## 3. Financial & Tax Data Model

- **Paise Precision:** All prices, subtotals, shipping charges, discounts, and order amounts are stored as integer **paise** (`1 INR = 100 paise`) in the database to prevent floating-point rounding errors. Formatting to `₹` occurs strictly in the UI.
- **GST Tax Mode (`gst_enabled`):**
  - Prices listed on storefront are GST-inclusive.
  - When `gst_enabled = false`: Invoices render as **Bill of Supply / Sale Receipt** without GSTIN or tax split.
  - When `gst_enabled = true`: Intra-state orders (Tamil Nadu, state code `33`) split tax into `CGST` + `SGST`. Inter-state orders render `IGST`.
