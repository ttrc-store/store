# TTRC Store — Deployment, DNS & Domain Health Audit

**Platform**: TTRC Store (`https://www.ttrc.store/`)  
**Deployment Target**: Vercel Pro (Anycast Edge Network)  
**Audit Date**: October 16, 2026  
**Auditor**: DevOps & Infrastructure Lead  

---

## 1. Domain Topology & Canonical Policy

The store architecture defines a single canonical domain to prevent duplicate indexing and ensure brand clarity:

- **Canonical Storefront**: `https://www.ttrc.store/`
- **Apex Storefront Redirect**: `https://ttrc.store/` $\xrightarrow{308}$ `https://www.ttrc.store/`
- **Secondary Domain Redirect**: `https://www.ttrc.shop/` $\xrightarrow{301}$ `https://www.ttrc.store/`
- **Apex Secondary Redirect**: `https://ttrc.shop/` $\xrightarrow{308}$ `https://www.ttrc.shop/` $\xrightarrow{301}$ `https://www.ttrc.store/`
- **Primary Corporate Portal**: `https://www.tamizhtech.in/` (Separate corporate landing page)

---

## 2. Empirical DNS & Network Inspection

Each endpoint was tested using direct socket connections, DNS queries, and cURL requests:

### 2.1 `www.ttrc.store` (Canonical Storefront)
- **DNS Resolution**: `216.198.79.1`, `64.29.17.1` (Vercel Anycast)
- **HTTP Status**: **200 OK**
- **TLS Certificate**: Issued by Let's Encrypt / Vercel; Valid until **January 9, 2027 GMT**
- **Edge Node**: `bom1` (Mumbai, India Anycast node)
- **SEO & Indexing**: `robots.txt` (200 OK) and `sitemap.xml` (200 OK) verified accessible.

### 2.2 `ttrc.store` (Apex Storefront)
- **DNS Resolution**: `216.198.79.1`
- **HTTP Status**: **308 Permanent Redirect**
- **Location Header**: `https://www.ttrc.store/`
- **TLS Certificate**: Valid until **January 9, 2027 GMT**

### 2.3 `www.ttrc.shop` (Secondary Domain)
- **DNS Resolution**: `64.29.17.65`, `216.198.79.65`
- **HTTP Status**: **301 Moved Permanently**
- **Location Header**: `https://www.ttrc.store/`
- **TLS Certificate**: Valid until **January 9, 2027 GMT**
- **SEO Equity**: Properly passes link authority to primary storefront without content duplication.

### 2.4 `ttrc-store.vercel.app` (Vercel Default Subdomain)
- **DNS Resolution**: `216.198.79.195`, `64.29.17.195`
- **HTTP Status**: **200 OK**
- **TLS Certificate**: Wildcard `*.vercel.app`; Valid until **November 27, 2026 GMT**

### 2.5 `tamizhtech.in` & `www.tamizhtech.in` (Corporate Domain)
- **`www.tamizhtech.in`**:
  - DNS: `76.76.21.93`, `66.33.60.194`
  - HTTP Status: **200 OK** (TLS Valid until January 2, 2027 GMT).
- **`tamizhtech.in` (Apex)**:
  - DNS: Returns 4 competing A records: `3.33.130.190`, `15.197.148.33` (AWS Global Accelerator), `76.76.21.21`, `216.198.79.1` (Vercel).
  - HTTP Status: **FAIL (SSL alert number 112: tlsv1 unrecognized name)** when reaching the AWS nodes.
  - **Root Cause**: Conflicting legacy DNS records at registrar.

---

## 3. Environment Variable Audit (Presence & Security)

| Variable Name | Environment | Server/Client Exposure | Configured Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| `MONGODB_URI` | Production / Preview | Server Only | **Configured** | Authoritative database cluster. |
| `RAZORPAY_KEY_ID` | Production | Server Only | **Required** | Production merchant key. |
| `RAZORPAY_KEY_SECRET` | Production | Server Only | **Required** | Secret key for verification and refunds. |
| `RAZORPAY_WEBHOOK_SECRET`| Production | Server Only | **Required** | HMAC signature secret for `/api/webhooks/razorpay`. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`| Production | Client Bundle | **Required** | Public key for Razorpay checkout popup. |
| `JWT_SECRET` | Production | Server Only | **Configured** | Web Crypto HMAC session signing. |
| `RESEND_API_KEY` | Production | Server Only | **Configured** | Transactional emails and restock alerts. |
| `NEXT_PUBLIC_SENTRY_DSN` | Production | Client / Server | **Optional** | Real-user error reporting. |

---

## 4. Required Human Actions (Registrar & DNS)

### Action DOM-ACT-1: Fix Apex DNS for `tamizhtech.in`
1. Log in to the domain registrar managing `tamizhtech.in` (e.g. GoDaddy / Cloudflare).
2. Open DNS Zone Management for `tamizhtech.in`.
3. Locate and **DELETE** the stale A records pointing to:
   - `3.33.130.190`
   - `15.197.148.33`
4. Ensure the sole apex A record points to Vercel IP: `76.76.21.21` (or configure an ALIAS/ANAME to `cname.vercel-dns.com`).
5. Verify resolution with `nslookup tamizhtech.in`.
