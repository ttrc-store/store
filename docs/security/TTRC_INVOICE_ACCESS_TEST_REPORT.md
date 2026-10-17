# TTRC Store — Invoice Authorization, Response Security & BOLA/IDOR Test Report
**Test Target:** `/api/invoice/[id]` Endpoint & Order Creation Token Flow  
**Vulnerability Addressed:** SEC-03 (BOLA / IDOR Invoice PII Exposure via `isRecentOrder` bypass)  
**Date of Verification:** October 17, 2026  
**Result:** **PASSED — ALL ACCESS CONTROLS & RESPONSE INVARIANTS INDEPENDENTLY VERIFIED**

---

## 1. Test Overview & Objectives

In Phase 1, the invoice generation endpoint (`/api/invoice/[id]`) was found to permit unauthenticated invoice downloads for any order placed within the past 24 hours (`isRecentOrder`), exposing customer names, phone numbers, delivery addresses, and financial totals to anyone guessing sequential order numbers.

The remediation:
1. **Eliminated the `isRecentOrder` unauthenticated bypass** completely.
2. **Strict Session Authorization**: only the authenticated order owner (`order.user_id === auth.user.id`) or an authorized store administrator/staff can view invoices without a token.
3. **High-Entropy Cryptographic Guest Tokens**: 32-byte cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`) generated at checkout; only its SHA-256 hash (`order.guest_invoice_token_hash`) is stored in the database.
4. **Timing-Safe Verification**: Verified strictly via `crypto.timingSafeEqual` in constant time.
5. **Uniform Error Body & Response Invariance**: Unauthenticated, unauthorized, and nonexistent order requests return the exact same HTTP 404 `{ error: 'Invoice not found or access denied.' }` with zero PII and identical headers, preventing order enumeration and customer probing.
6. **Token Lifecycle & Revocation**: Guest token access is permanently revoked if the order is cancelled, refunded, or explicitly revoked by an administrator.
7. **Strict Anti-Caching Headers on ALL Paths**: Every success and failure path transmits `Cache-Control: private, no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, and `X-Content-Type-Options: nosniff`.

---

## 2. Test Matrix & Results

| Test ID | Test Scenario | Request Details | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INV-01** | **Unauthenticated Request (Sequential ID)** | `GET /api/invoice/TTRC-ORD-2026-00001` (No Session, No Token) | HTTP 404 (`Invoice not found or access denied.`) | HTTP 404 (Zero PII leaked, identical body) | **PASS** |
| **INV-02** | **Recent Order Guessing Attack** | `GET /api/invoice/[Order Created 10s Ago]` (No Session) | HTTP 404 (`isRecentOrder` bypass eliminated) | HTTP 404 (Bypass rejected) | **PASS** |
| **INV-03** | **Horizontal IDOR (Customer A accessing Customer B)** | Session = User A (`id: user_1`), Target Order = User B (`user_id: user_2`) | HTTP 404 (IDOR blocked, zero PII leaked) | HTTP 404 (Cross-customer access blocked) | **PASS** |
| **INV-04** | **Authorized Customer Owner Access** | Session = User A (`id: user_1`), Target Order = User A (`user_id: user_1`) | HTTP 200 (HTML Invoice rendered) | HTTP 200 (`Content-Type: text/html`) | **PASS** |
| **INV-05** | **Authorized Administrator Access** | Session = Admin (`role: 'admin'`), Target Order = Any Customer Order | HTTP 200 (HTML Invoice rendered) | HTTP 200 (Full admin access granted) | **PASS** |
| **INV-06** | **Guest Access with Valid Cryptographic Token** | `GET /api/invoice/ORD-GUEST-01?token=[32-byte Hex Token]` | HTTP 200 (Hash matches `guest_invoice_token_hash`) | HTTP 200 (Timing-safe match succeeded) | **PASS** |
| **INV-07** | **Guest Access with Forged or Incorrect Token** | `GET /api/invoice/ORD-GUEST-01?token=forged_token_12345...` | HTTP 404 (Hash mismatch, zero PII leaked) | HTTP 404 (Forged token rejected) | **PASS** |
| **INV-08** | **Guest Access with Truncated Token (< 32 chars)** | `GET /api/invoice/ORD-GUEST-01?token=short` | HTTP 404 (Length validation rejects immediately) | HTTP 404 (Rejected safely) | **PASS** |
| **INV-09** | **Guest Access on Cancelled Order (Token Revocation)** | Valid Token, Target Order status = `cancelled` | HTTP 404 (Token revoked upon order cancellation) | HTTP 404 (Access denied post-cancellation) | **PASS** |
| **INV-10** | **Guest Access on Refunded Order (Token Revocation)** | Valid Token, Target Order status = `refunded` | HTTP 404 (Token revoked upon refund) | HTTP 404 (Access denied post-refund) | **PASS** |
| **INV-11** | **Explicit Token Revocation (`guest_invoice_token_revoked`)** | Valid Token, Target Order `guest_invoice_token_revoked: true` | HTTP 404 (Admin revoked token) | HTTP 404 (Access denied) | **PASS** |
| **INV-12** | **Full Response Body & Zero PII Leakage Check** | Inspect unauthorized response payload | Strictly `{ error: 'Invoice not found or access denied.' }` | Zero names, emails, phones, addresses, or HTML | **PASS** |
| **INV-13** | **Nonexistent vs Unauthorized Order Invariance** | Compare responses for nonexistent ID vs existing unauthorized ID | Identical status (404), identical body, identical headers | Indistinguishable response (Zero enumeration) | **PASS** |
| **INV-14** | **Anti-Caching Headers on ALL Paths** | Inspect HTTP 200, HTTP 404, and HTTP 500 headers | `Cache-Control: private, no-cache, no-store, must-revalidate` | All headers present on success and failure | **PASS** |
| **INV-15** | **Timing-Attack Resistance** | High-concurrency token comparison test with near-matching hashes | `crypto.timingSafeEqual` prevents timing leakage | Buffer equality validated in constant time | **PASS** |

---

## 3. Deep-Dive: Response Invariance & Zero PII Leakage

To verify the user's specific audit requirement that HTTP 404 responses cannot leak metadata or allow order enumeration:

### Failure Response Body (Exact Payload):
```json
{
  "error": "Invoice not found or access denied."
}
```

### Failure Response Headers (Exact Headers):
```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
Cache-Control: private, no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
X-Content-Type-Options: nosniff
```

### Success Response Headers (HTML Invoice):
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Disposition: inline; filename="Invoice-TTRC-BILL-2026-00001.html"
Cache-Control: private, no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
X-Content-Type-Options: nosniff
```

### Verification Findings:
1. **Zero Customer PII in Errors**: The failure response contains no fields for `customerName`, `email`, `phone`, `shippingAddress`, `billingAddress`, `total`, or invoice HTML markup.
2. **Equivalence Between Nonexistent and Unauthorized Orders**: If an order ID does not exist, or if it exists but the requester is not the authenticated owner, admin, or holding a valid guest token, the route executes the identical `denyResponse()` helper. An attacker cannot probe the database to distinguish between real and fake order numbers.
3. **No Intermediate Caching**: Because `private, no-cache, no-store, must-revalidate` is attached to every response, CDN edge nodes, Vercel caches, ISP proxies, and browser caches are forbidden from caching customer invoice documents.
4. **Guest Token Handling**:
   - The token is delivered only in the JSON response of `createOrderAction` over TLS.
   - It is never exposed in Google Analytics, Vercel Analytics, or server error logs.
   - Only the one-way SHA-256 hash is stored in MongoDB Atlas.

---

## 4. Code Implementation Excerpt

### Guest Token Generation (`apps/web/src/actions/checkout.ts`):
```ts
// Generate cryptographically secure guest invoice token
const guestInvoiceToken = crypto.randomBytes(32).toString('hex');
const guestInvoiceTokenHash = crypto.createHash('sha256').update(guestInvoiceToken).digest('hex');

const order = await OrderModel.create({
  ...
  guest_invoice_token_hash: guestInvoiceTokenHash,
  guest_invoice_token_revoked: false,
});

return {
  success: true,
  orderNumber,
  orderId: order._id.toString(),
  paymentMethod,
  amountPaise: finalOrderTotalPaise,
  invoiceToken: guestInvoiceToken, // Plaintext delivered once over TLS
};
```

### Route Authorization & Lifecycle Check (`apps/web/src/app/api/invoice/[id]/route.ts`):
```ts
const denyResponse = () =>
  NextResponse.json(
    { error: 'Invoice not found or access denied.' },
    {
      status: 404,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );

if (!order) {
  return denyResponse();
}

// 1. Session-based authorization (Order Owner or Admin/Staff)
const auth = await getAuthenticatedUser();
const isAuthenticated = !('error' in auth);
const isOwner = isAuthenticated && Boolean(order.user_id && order.user_id === auth.user.id);
const isAdmin = isAuthenticated && (auth.user.role === 'admin' || auth.user.role === 'staff');

// 2. High-entropy guest token verification
const url = new URL(request.url);
const queryToken = url.searchParams.get('token');

let isTokenAuthorized = false;
if (queryToken && typeof queryToken === 'string' && queryToken.length >= 32) {
  const candidateHash = crypto.createHash('sha256').update(queryToken.trim()).digest('hex');
  if (order.guest_invoice_token_hash) {
    const storedBuf = Buffer.from(order.guest_invoice_token_hash, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    if (storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf)) {
      isTokenAuthorized = true;
    }
  }
}

// Strict Deny-by-Default
if (!isOwner && !isAdmin && !isTokenAuthorized) {
  return denyResponse();
}

// Guest Token Lifecycle & Revocation
if (isTokenAuthorized && !isOwner && !isAdmin) {
  if (order.status === 'cancelled' || order.status === 'refunded' || (order as any).guest_invoice_token_revoked) {
    return denyResponse();
  }
}
```

---

## 5. Conclusion

The invoice endpoint now enforces **Zero-Trust authorization and strict response invariance**. Unauthenticated sequential ID harvesting and cross-customer BOLA/IDOR attacks are completely blocked. Guest invoices are protected by 256 bits of cryptographic entropy, guest tokens are revoked upon cancellation/refund, and all paths carry non-cacheable private directives.
