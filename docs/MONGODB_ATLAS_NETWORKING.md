# MongoDB Atlas Network Access & Vercel Networking Architecture

This document outlines the network security design and IP allowlisting strategy connecting **Vercel Serverless Functions** with **MongoDB Atlas** for TTRC Store (`ttrc.store`).

---

## 1. Network Topology Overview

```
                                  +------------------------------------+
                                  |         Vercel Edge / CDN          |
                                  |      (Anycast DNS, TLS 1.3)        |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |     Vercel Serverless Functions    |
                                  |       (Node.js App Router API)     |
                                  +-----------------+------------------+
                                                    |
                                +-------------------+-------------------+
                                |                                       |
                     [Option A: Pro Static IPs]             [Option B: Enterprise VPC]
                     Outbound NAT Gateway IP Range         AWS PrivateLink / Peering
                                |                                       |
                                +-------------------+-------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |         MongoDB Atlas Cluster       |
                                  |         (AWS ap-south-1 Mumbai)    |
                                  |     TLS 1.3 + SCRAM-SHA-256 Auth   |
                                  +------------------------------------+
```

---

## 2. Vercel Plan & Network Configuration Matrix

Vercel functions do not use a single persistent server IP by default. Depending on the Vercel subscription plan, choose the appropriate network architecture below:

| Deployment Tier | Vercel Networking Capability | MongoDB Atlas Network Access Rule | Security Level |
|---|---|---|---|
| **Vercel Hobby / Preview** | Dynamic Outbound Egress IPs (Serverless instances span dynamic AWS/Cloudflare pools). | Allowlist `0.0.0.0/0` **ONLY** with mandatory compensating controls (see Section 3). | Moderate (Protected by strong credentials & TLS) |
| **Vercel Pro** | Dedicated Static Outbound IPs via Vercel Secure Compute / Static IP integration. | Add specific provisioned Vercel outbound IP CIDRs to Atlas IP Access List. Delete `0.0.0.0/0`. | High (Network-layer perimeter restriction) |
| **Vercel Enterprise** | Dedicated VPC Peering / AWS PrivateLink / Secure Compute. | Private Network Peering directly to MongoDB Atlas AWS VPC (`ap-south-1` Mumbai). Zero public transit. | Enterprise Maximum |

---

## 3. Mandatory Compensating Controls (When using Dynamic IPs)

If your deployment environment uses dynamic serverless egress (e.g. staging or standard Vercel), `0.0.0.0/0` must be accompanied by the following mandatory defenses:

1. **SCRAM-SHA-256 / X.509 Authentication**:
   - Plain text authentication is forbidden.
   - Database user passwords must be generated with >= 32 bytes of cryptographically secure random entropy (`crypto.randomBytes(32).toString('hex')`).
2. **TLS 1.3 In-Transit Encryption**:
   - The connection string must enforce `ssl=true&tls=true`.
   - Data in transit between Vercel and Atlas is encrypted using modern TLS ciphers.
3. **Principle of Least Privilege Database Role**:
   - The production user (`ttrcstoree_db_user`) must only possess `readWrite` access to the dedicated application database (`ttrc_store`).
   - The user must **never** hold cluster administrative privileges (`clusterAdmin`, `dbAdminAnyDatabase`, `atlasAdmin`).
4. **Network Access Auto-Expiry**:
   - For temporary testing IP addresses, configure Atlas entries with the **"Temporary Access (Auto-expire in 6h / 24h)"** setting.

---

## 4. Upgrading to Vercel Pro Static IPs (Step-by-Step)

When ready to restrict MongoDB Atlas to dedicated IPs on Vercel Pro:

1. In the **Vercel Project Dashboard**, navigate to **Settings -> Functions -> Static IP**.
2. Enable Static IPs. Vercel will provision dedicated outbound proxy IP addresses.
3. Copy the outbound IP addresses provided by Vercel.
4. Open the **MongoDB Atlas Console -> Network Access -> IP Access List**.
5. Click **Add IP Address**:
   - Paste the Vercel static IP CIDR blocks.
   - Set Description to `Vercel Production Outbound`.
6. Remove the `0.0.0.0/0` rule.
7. Test database connectivity using `pnpm test:unit` and by triggering a live store search.

---

## 5. Upgrading to Enterprise Secure Compute / AWS PrivateLink

For enterprise launch:

1. Host the MongoDB Atlas cluster in the same AWS region as Vercel functions (`ap-south-1` Mumbai, India).
2. Set up **AWS PrivateLink** inside MongoDB Atlas:
   - Go to **Atlas -> Network Access -> Private Endpoint**.
   - Create a dedicated AWS PrivateLink endpoint.
3. Associate Vercel Secure Compute VPC peering with the Atlas endpoint service.
4. Traffic is routed over private AWS infrastructure with sub-millisecond latency and zero internet exposure.
