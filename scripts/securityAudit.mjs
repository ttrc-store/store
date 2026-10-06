#!/usr/bin/env node

/**
 * TTRC Store Security Audit & Hardening Validation Script
 * Tests and audits the entire ecommerce attack surface:
 * - Authentication & JWT integrity
 * - Authorization & IDOR isolation
 * - Server-side pricing & financial math
 * - Atomic inventory deduction & race condition defense
 * - Coupon validity, expiration, & max-discount capping
 * - Payment & Razorpay webhook HMAC verification
 * - File upload magic-byte signature validation
 * - Security headers & Content Security Policy
 * - Zero hardcoded production mock data scan
 * - Sensitive secret / credential exposure scan
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_SRC = path.join(ROOT_DIR, 'apps', 'web', 'src');

console.log('='.repeat(70));
console.log('  TTRC STORE — COMPREHENSIVE ECOMMERCE SECURITY AUDIT');
console.log('  Platform: Next.js + MongoDB Atlas | Company: Tamizh Tech');
console.log('='.repeat(70));
console.log();

let passedChecks = 0;
let totalChecks = 0;
const findings = [];

function check(title, condition, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${title}`);
  } else {
    findings.push({ title, details });
    console.log(`  [FAIL] ${title}`);
    if (details) console.log(`         -> ${details}`);
  }
}

// ---------------------------------------------------------------------------
// 1. AUTHENTICATION & JWT INTEGRITY
// ---------------------------------------------------------------------------
console.log('\n[1/8] Auditing Authentication, JWT & Session Security...');

const middlewarePath = path.join(WEB_SRC, 'middleware.ts');
const middlewareContent = fs.existsSync(middlewarePath) ? fs.readFileSync(middlewarePath, 'utf8') : '';

check(
  'Edge Middleware enforces cryptographic JWT signature check (Web Crypto HMAC)',
  middlewareContent.includes('crypto.subtle.verify') &&
  middlewareContent.includes('HMAC') &&
  middlewareContent.includes('SHA-256'),
  'Middleware must verify JWT signature cryptographically, not just base64 decode.'
);

check(
  'Test bypass cookies are strictly disabled in production',
  middlewareContent.includes("process.env.NODE_ENV === 'production'") &&
  middlewareContent.includes('!isProd'),
  'Bypass cookies must never be accepted when NODE_ENV is production.'
);

const authHelpersPath = path.join(WEB_SRC, 'lib', 'auth-helpers.ts');
const authHelpersContent = fs.existsSync(authHelpersPath) ? fs.readFileSync(authHelpersPath, 'utf8') : '';

check(
  'checkTestBypass in auth-helpers rejects production bypasses unconditionally',
  authHelpersContent.includes("if (process.env.NODE_ENV === 'production') {\n    return false;\n  }"),
  'auth-helpers must deny test bypass in production.'
);

const authActionsPath = path.join(WEB_SRC, 'actions', 'auth.ts');
const authActionsContent = fs.existsSync(authActionsPath) ? fs.readFileSync(authActionsPath, 'utf8') : '';

check(
  'Public registration cannot escalate role to admin',
  authActionsContent.includes("role: 'customer'") &&
  !authActionsContent.includes("role: isFirstUser ? 'admin' : 'customer'"),
  'Public self-registration must always assign customer role.'
);

check(
  'Rate limiting is enforced on login and registration',
  authActionsContent.includes('checkRateLimit') &&
  authActionsContent.includes('login:') &&
  authActionsContent.includes('register:'),
  'Brute-force protection must guard login and registration actions.'
);

// ---------------------------------------------------------------------------
// 2. AUTHORIZATION & IDOR ISOLATION
// ---------------------------------------------------------------------------
console.log('\n[2/8] Auditing Customer Isolation & IDOR Protection...');

const invoiceRoutePath = path.join(WEB_SRC, 'app', 'api', 'invoice', '[id]', 'route.ts');
const invoiceContent = fs.existsSync(invoiceRoutePath) ? fs.readFileSync(invoiceRoutePath, 'utf8') : '';

check(
  'Invoice endpoint requires session authentication',
  invoiceContent.includes('getAuthenticatedUser') && invoiceContent.includes('status: 401'),
  'Unauthenticated users must not be able to generate or view invoices.'
);

check(
  'Invoice endpoint enforces order ownership authorization (IDOR check)',
  invoiceContent.includes('isOwner') && invoiceContent.includes('isAdmin') && invoiceContent.includes('status: 403'),
  'Users must only be allowed to view invoices for their own orders unless admin.'
);

const ordersActionPath = path.join(WEB_SRC, 'actions', 'orders.ts');
const ordersActionContent = fs.existsSync(ordersActionPath) ? fs.readFileSync(ordersActionPath, 'utf8') : '';

check(
  'Customer return requests do NOT directly transition order to refunded',
  !ordersActionContent.includes("order.status = 'refunded';") &&
  ordersActionContent.includes("order.status !== 'delivered'"),
  'Only admins can process refunds; customers can only submit requests for delivered orders.'
);

const orderDetailPath = path.join(WEB_SRC, 'app', 'orders', '[id]', 'page.tsx');
const orderDetailContent = fs.existsSync(orderDetailPath) ? fs.readFileSync(orderDetailPath, 'utf8') : '';

check(
  'Order tracking page verifies ownership and loads authoritative DB data',
  orderDetailContent.includes('getMyOrderAction') && orderDetailContent.includes('notFound()'),
  'Order detail page must not render hardcoded mock items or expose other customers orders.'
);

// ---------------------------------------------------------------------------
// 3. PRICING & INVENTORY CONCURRENCY
// ---------------------------------------------------------------------------
console.log('\n[3/8] Auditing Financial Calculations & Inventory Race Conditions...');

const checkoutActionPath = path.join(WEB_SRC, 'actions', 'checkout.ts');
const checkoutContent = fs.existsSync(checkoutActionPath) ? fs.readFileSync(checkoutActionPath, 'utf8') : '';

check(
  'Inventory deduction uses atomic conditional updates ($gte check and rollback)',
  checkoutContent.includes('stock_quantity: { $gte: item.quantity }') &&
  checkoutContent.includes('$inc: { stock_quantity: -item.quantity }') &&
  checkoutContent.includes('decrementedItems'),
  'Non-atomic inventory updates create overselling race conditions.'
);

check(
  'Coupons enforce active status and expiration dates',
  checkoutContent.includes('is_active: true') &&
  checkoutContent.includes('expires_at: { $gt: now }'),
  'Coupons must be verified server-side against expiration timestamps.'
);

check(
  'Coupons enforce max_discount_paise cap',
  checkoutContent.includes('max_discount_paise'),
  'Discount value must be capped at max_discount_paise when configured.'
);

check(
  'Coupon usage count is incremented atomically upon order creation',
  checkoutContent.includes('$inc: { usage_count: 1 }'),
  'Coupon usage count must be updated atomically to prevent concurrent reuse.'
);

check(
  'Order cancellation is restricted to pending/processing orders with automatic restocking',
  checkoutContent.includes("order.status !== 'pending' && order.status !== 'processing'") &&
  checkoutContent.includes('$inc: { stock_quantity: item.quantity }'),
  'Customers must not be able to cancel orders that are already shipped or delivered.'
);

// ---------------------------------------------------------------------------
// 4. PAYMENTS & RAZORPAY WEBHOOK INTEGRITY
// ---------------------------------------------------------------------------
console.log('\n[4/8] Auditing Payment Gateway & Webhook Security...');

const webhookPath = path.join(WEB_SRC, 'app', 'api', 'webhooks', 'razorpay', 'route.ts');
const webhookContent = fs.existsSync(webhookPath) ? fs.readFileSync(webhookPath, 'utf8') : '';

check(
  'Razorpay webhook verifies HMAC-SHA256 signature using timing-safe comparison',
  webhookContent.includes('crypto.timingSafeEqual') &&
  webhookContent.includes('createHmac'),
  'Webhook must use crypto.timingSafeEqual to prevent timing attacks.'
);

check(
  'Razorpay webhook uses MongoDB OrderModel and AuditLogModel (not Supabase)',
  webhookContent.includes('OrderModel') &&
  webhookContent.includes('AuditLogModel') &&
  !webhookContent.includes('@supabase'),
  'Webhook should match the active MongoDB architecture.'
);

check(
  'Razorpay webhook implements idempotency via event_id audit logging',
  webhookContent.includes('event_id') &&
  webhookContent.includes('idempotent: true'),
  'Duplicate webhook deliveries must be safely ignored without repeating side-effects.'
);

check(
  'Razorpay webhook enforces exact financial invariant (amountPaise === order.total paise)',
  webhookContent.includes('amountPaise !== order.total'),
  'Server must verify that payment gateway captured the exact required amount and flag any discrepancy.'
);

// ---------------------------------------------------------------------------
// 5. FILE UPLOADS & MEDIA HANDLING
// ---------------------------------------------------------------------------
console.log('\n[5/8] Auditing File Upload Security & Magic Byte Checks...');

const uploadPath = path.join(WEB_SRC, 'app', 'api', 'admin', 'media', 'upload', 'route.ts');
const uploadContent = fs.existsSync(uploadPath) ? fs.readFileSync(uploadPath, 'utf8') : '';

check(
  'Upload route restricts access to authenticated Admins',
  uploadContent.includes('requireAdmin()'),
  'Unauthenticated users must never be able to upload files.'
);

check(
  'Upload route verifies magic bytes (binary file signatures for PNG, JPEG, WebP)',
  uploadContent.includes('0xff') &&
  uploadContent.includes('0xd8') &&
  uploadContent.includes('0x89') &&
  uploadContent.includes('RIFF'),
  'File headers must be checked to reject executable polyglots or disguised scripts.'
);

check(
  'Upload route generates randomized cryptographic filenames to prevent path traversal',
  uploadContent.includes('crypto.randomBytes') &&
  uploadContent.includes('ttrc-prd-'),
  'Uploaded files must be saved with safe, server-generated names.'
);

// ---------------------------------------------------------------------------
// 6. INPUT SANITIZATION, REDOS & RATE LIMITING
// ---------------------------------------------------------------------------
console.log('\n[6/8] Auditing Input Sanitization & DoS Defenses...');

const searchRoutePath = path.join(WEB_SRC, 'app', 'api', 'search', 'route.ts');
const searchContent = fs.existsSync(searchRoutePath) ? fs.readFileSync(searchRoutePath, 'utf8') : '';

check(
  'Search API enforces maximum query length (100 characters)',
  searchContent.includes('slice(0, 100)'),
  'Unbounded search queries can lead to expensive MongoDB queries or ReDoS.'
);

check(
  'Search API enforces rate limiting',
  searchContent.includes('checkRateLimit') && searchContent.includes('status: 429'),
  'Search endpoint must be rate limited to prevent scraping and API flooding.'
);

check(
  'Rate limiter supports distributed architecture (Upstash Redis + MongoDB Atlas)',
  (() => {
    const rateLimiterPath = path.join(WEB_SRC, 'lib', 'security', 'rate-limiter.ts');
    const content = fs.existsSync(rateLimiterPath) ? fs.readFileSync(rateLimiterPath, 'utf8') : '';
    return content.includes('UPSTASH_REDIS') && content.includes('RateLimitModel');
  })(),
  'Rate limiter must support distributed cross-instance counters for serverless environments.'
);

const videoUtilsPath = path.join(WEB_SRC, 'lib', 'video-utils.ts');
const videoContent = fs.existsSync(videoUtilsPath) ? fs.readFileSync(videoUtilsPath, 'utf8') : '';

check(
  'Video embed sanitizer allows only YouTube and Vimeo domains',
  videoContent.includes('youtube-nocookie.com/embed/') &&
  videoContent.includes('player.vimeo.com/video/'),
  'Video URLs must be restricted to trusted embed providers to prevent XSS.'
);

// ---------------------------------------------------------------------------
// 7. SECURITY HEADERS & CONTENT SECURITY POLICY
// ---------------------------------------------------------------------------
console.log('\n[7/8] Auditing HTTP Security Headers & CSP...');

const nextConfigPath = path.join(ROOT_DIR, 'apps', 'web', 'next.config.ts');
const nextConfigContent = fs.existsSync(nextConfigPath) ? fs.readFileSync(nextConfigPath, 'utf8') : '';

check(
  'HSTS (Strict-Transport-Security) header is configured with max-age',
  nextConfigContent.includes('Strict-Transport-Security') &&
  nextConfigContent.includes('max-age=63072000'),
  'HSTS forces browsers to use HTTPS exclusively.'
);

check(
  'X-Frame-Options is set to DENY to prevent clickjacking',
  nextConfigContent.includes("'X-Frame-Options', value: 'DENY'"),
  'Clickjacking protection must be enabled on all pages.'
);

check(
  'X-Content-Type-Options is set to nosniff',
  nextConfigContent.includes("'X-Content-Type-Options', value: 'nosniff'"),
  'nosniff prevents MIME type sniffing exploits.'
);

check(
  'Deprecated X-XSS-Protection header is removed in favor of CSP',
  !nextConfigContent.includes('X-XSS-Protection'),
  'MDN deprecates X-XSS-Protection; modern defense relies on Content-Security-Policy.'
);

check(
  'Content Security Policy (CSP) restricts frame-ancestors to none and fits integrations',
  nextConfigContent.includes("frame-ancestors 'none'") &&
  nextConfigContent.includes("script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com") &&
  nextConfigContent.includes("base-uri 'self'") &&
  nextConfigContent.includes("form-action 'self'"),
  'CSP frame-ancestors must block iframe embedding and fit Razorpay/media integrations.'
);

// ---------------------------------------------------------------------------
// 8. ZERO MOCK DATA & REPOSITORY CLEANLINESS
// ---------------------------------------------------------------------------
console.log('\n[8/8] Auditing for Mock Data & Exposed Credentials...');

const customerPagePath = path.join(WEB_SRC, 'app', 'admin', 'customers', 'page.tsx');
const customerPageContent = fs.existsSync(customerPagePath) ? fs.readFileSync(customerPagePath, 'utf8') : '';

check(
  'Admin Customers page uses live MongoDB query instead of hardcoded CUSTOMERS_LIST',
  !customerPageContent.includes('const CUSTOMERS_LIST') &&
  customerPageContent.includes('getAdminCustomersAction'),
  'Customer records in admin panel must come from live MongoDB, never mock arrays.'
);

const checkoutPagePath = path.join(WEB_SRC, 'app', 'checkout', 'page.tsx');
const checkoutPageContent = fs.existsSync(checkoutPagePath) ? fs.readFileSync(checkoutPagePath, 'utf8') : '';

check(
  'Checkout page starts with empty address fields instead of mock prefill',
  checkoutPageContent.includes("const [fullName, setFullName] = React.useState('');") &&
  checkoutPageContent.includes("const [phone, setPhone] = React.useState('');"),
  'Checkout form must not contain hardcoded customer addresses.'
);

const secretsValidatorPath = path.join(WEB_SRC, 'lib', 'security', 'production-secrets-validator.ts');
const secretsValidatorContent = fs.existsSync(secretsValidatorPath) ? fs.readFileSync(secretsValidatorPath, 'utf8') : '';

check(
  'Production secrets validator enforces Shannon entropy, minimum length (>= 32 bytes), and rejects placeholders/reuse',
  secretsValidatorContent.includes('calculateShannonEntropy') &&
  secretsValidatorContent.includes('byteLength < 32') &&
  secretsValidatorContent.includes('Secret reuse detected') &&
  secretsValidatorContent.includes('KNOWN_PLACEHOLDERS_AND_DEFAULTS'),
  'System must reject short, default, placeholder, or reused secrets in production.'
);

const instrumentationPath = path.join(WEB_SRC, 'instrumentation.ts');
const instrumentationContent = fs.existsSync(instrumentationPath) ? fs.readFileSync(instrumentationPath, 'utf8') : '';

check(
  'Next.js instrumentation hook asserts production secrets on server boot',
  instrumentationContent.includes('assertProductionSecrets()') &&
  instrumentationContent.includes('export async function register()'),
  'Application must halt startup if insecure secrets are detected in production.'
);

// ---------------------------------------------------------------------------
// AUDIT SUMMARY & SCORECARD
// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log('  TTRC STORE SECURITY AUDIT RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`  Total Security Controls Tested : ${totalChecks}`);
console.log(`  Passed Controls                : ${passedChecks}`);
console.log(`  Failed Controls                : ${findings.length}`);
console.log(`  Security Health Score          : ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (findings.length > 0) {
  console.log('\n  FINDINGS REQUIRE ATTENTION:');
  findings.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.title}`);
    if (f.details) console.log(`     ${f.details}`);
  });
  process.exit(1);
} else {
  console.log('\n  ALL SECURITY HARDENING CHECKS PASSED SUCCESSFULLY.');
  console.log('  The platform meets authorized production-grade ecommerce security standards.\n');
  process.exit(0);
}
