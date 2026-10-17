# TTRC Store — Unified Ecommerce Email Theme Standard

## 1. Brand Theme & Color Tokens

The TTRC Store transactional email theme adheres strictly to the official electronics and robotics brand palette:

| Token Name | Hex Code | Visual Application in Emails |
|---|---|---|
| **Primary Violet** | `#844AFB` | Top header accent line, primary CTA buttons, code highlights, signature brand color |
| **Deep Purple** | `#6721F2` | Category badges, sub-headings, focus rings, notice tags |
| **Navy-Purple** | `#1E0D45` | Main headings, table summary totals, key label descriptors |
| **Black / Dark Ink** | `#050507` | Primary body text, heading accents |
| **Off-White Canvas** | `#FDFDFD` | Email background canvas, zebra table stripes, card background |
| **Pure White** | `#FFFFFF` | Main email card container, logo presentation canvas, CTA text |
| **Lavender** | `#EEE8FA` | Alert cards, code box backgrounds, table dividers, card borders |
| **Soft Lavender** | `#AF87F8` | Subtle border accents, product card borders |
| **Neutral Gray** | `#6D6A6A` | Secondary descriptions, captions, footers, timestamps |

---

## 2. Typography Standard & Fallbacks

Email clients render web fonts variably. The TTRC email system loads Google Fonts via `@import` in the `<head>` while maintaining email-safe system fallbacks across all inline styles:

1. **Headings & Badges**:
   - Primary: `'Space Grotesk'`
   - Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
   - Weight: `700` (Bold) to `800` (Extra Bold)

2. **Body Text, Tables & Metadata**:
   - Primary: `'Plus Jakarta Sans'`
   - Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
   - Weight: `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold)

3. **Verification Codes & AWBs**:
   - Monospace: `'Space Grotesk', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace`
   - Letter Spacing: `8px`
   - Size: `36px`

---

## 3. Official Logo Asset & Placement (Single Source of Truth)

- **Asset Path**: `public/brand/ttrc-logo.png`
- **Hosted Public URL**: `https://www.ttrc.store/brand/ttrc-logo.png`
- **Verification**: Verified live via HTTP GET with status `200 OK`, `image/png`, `267KB` (native dimensions 1713×964 px).
- **Placement & Container Treatment**:
  - Located cleanly in the top header and/or bottom footer across all templates.
  - **Light-Background Treatment**: Rendered directly on the clean white/off-white background (`#FFFFFF` / `#FDFDFD`). Dark containers/boxes (`#050507`) are strictly prohibited because the official brand artwork features black/dark metallic lettering (`TT`, `C`, `STORE`), which would camouflage against a dark background.
  - **Dimensions**: Scaled cleanly with `width="160"`, `max-width: 160px; height: auto; display: block; border: 0; outline: none;` to ensure sharp rendering, perfect legibility of the typography, and responsive scaling across mobile and desktop inboxes (Gmail, Outlook, Apple Mail).

---

## 4. Mandatory Signature Standard

Both HTML and plain-text versions of every email include the exact signature block:
```text
Thanks & Regards,
Team TTRC
Think it. Build it. Make it. Move it.
https://www.ttrc.store/
Coimbatore, Tamil Nadu • Pan-India Express Robotics Delivery

+91 7904902978
```

