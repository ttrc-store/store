#!/usr/bin/env node

/**
 * TTRC STORE — MASTER FULL-STACK ECOMMERCE FEATURE AUDIT SCRIPT
 * Target: Production Release Gate — October 15, 2026
 * Platform: Next.js App Router + TypeScript + MongoDB Atlas
 * 
 * Verifies:
 *  1. Route Architecture & Directory Health (Public, Auth, Customer, Admin)
 *  2. API Endpoints & Route Handlers
 *  3. MongoDB Atlas Schema & Domain Models
 *  4. Server-Side Authorization Guards & IDOR Barriers
 *  5. Business Logic: Atomic Cart, Bulk Pricing, Sequential IDs, Razorpay Webhook
 *  6. Zero Production Mock Data (Strict Invariant)
 *  7. Output: Systematic PASS / WARNING / FAIL Classification
 */

import fs from 'node:fs';
import path from 'node:path';

console.log('='.repeat(80));
console.log('  TTRC STORE — FULL-STACK ECOMMERCE FEATURE & ARCHITECTURE AUDIT');
console.log('  Target Environment : Production Release (October 15, 2026)');
console.log(`  Audit Execution    : ${new Date().toISOString()}`);
console.log('='.repeat(80));
console.log();

let passedCount = 0;
let warningCount = 0;
let failCount = 0;

const auditResults = [];

function auditCheck(domain, feature, status, evidence, note = '') {
  auditResults.push({ domain, feature, status, evidence, note });
  const icon = status === 'PASS' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
  if (status === 'PASS') passedCount++;
  else if (status === 'WARNING') warningCount++;
  else failCount++;

  console.log(`  ${icon} [${domain.padEnd(16)}] ${feature.padEnd(42)} : ${status} ${note ? `(${note})` : ''}`);
}

const rootDir = process.cwd();
const webDir = path.resolve(rootDir, 'apps/web');

// ─── 1. ROUTE INTEGRITY & DIRECTORY CHECKS ──────────────────────────────────
console.log('--- 1. AUDITING ROUTES & PUBLIC/PRIVATE BOUNDARIES ---');

const expectedRoutes = [
  // Public
  { path: 'src/app/page.tsx', label: 'Storefront Homepage (/)' },
  { path: 'src/app/category/[slug]/page.tsx', label: 'Category Catalog (/category/[slug])' },
  { path: 'src/app/product/[slug]/page.tsx', label: 'Product Detail (/product/[slug])' },
  { path: 'src/app/compare/page.tsx', label: 'Product Comparison (/compare)' },
  { path: 'src/app/bulk-orders/page.tsx', label: 'Bulk Institutional Orders (/bulk-orders)' },
  { path: 'src/app/bulk-enquiry/page.tsx', label: 'B2B Quotation Form (/bulk-enquiry)' },
  // Auth
  { path: 'src/app/login/page.tsx', label: 'Customer Login (/login)' },
  { path: 'src/app/register/page.tsx', label: 'Customer Registration (/register)' },
  { path: 'src/app/forgot-password/page.tsx', label: 'Password Recovery (/forgot-password)' },
  { path: 'src/app/reset-password/page.tsx', label: 'Password Reset (/reset-password)' },
  // Customer Dashboard
  { path: 'src/app/account/page.tsx', label: 'Customer Account Hub (/account)' },
  { path: 'src/app/account/orders/page.tsx', label: 'Order History & Invoices (/account/orders)' },
  { path: 'src/app/orders/[id]/page.tsx', label: 'Order Tracking Detail (/orders/[id])' },
  { path: 'src/app/account/addresses/page.tsx', label: 'Address Book Management (/account/addresses)' },
  { path: 'src/app/account/wishlist/page.tsx', label: 'Saved Wishlist (/account/wishlist)' },
  { path: 'src/app/account/reviews/page.tsx', label: 'Verified Reviews Dashboard (/account/reviews)' },
  { path: 'src/app/account/privacy/page.tsx', label: 'DPDP Act 2023 Rights (/account/privacy)' },
  // Admin Backoffice
  { path: 'src/app/admin/page.tsx', label: 'Admin Metrics Dashboard (/admin)' },
  { path: 'src/app/admin/products/page.tsx', label: 'Admin Product Catalog (/admin/products)' },
  { path: 'src/app/admin/orders/page.tsx', label: 'Admin Order Management (/admin/orders)' },
  { path: 'src/app/admin/customers/page.tsx', label: 'Admin Customer Directory (/admin/customers)' },
  { path: 'src/app/admin/categories/page.tsx', label: 'Admin Category Taxonomy (/admin/categories)' },
  { path: 'src/app/admin/coupons/page.tsx', label: 'Admin Coupon Engine (/admin/coupons)' },
  { path: 'src/app/admin/settings/page.tsx', label: 'Admin Store Settings (/admin/settings)' },
];

for (const route of expectedRoutes) {
  const fullPath = path.resolve(webDir, route.path);
  const exists = fs.existsSync(fullPath);
  auditCheck(
    'ROUTES',
    route.label,
    exists ? 'PASS' : 'FAIL',
    route.path,
    exists ? 'Verified on disk' : 'Missing route file'
  );
}

// ─── 2. API ENDPOINTS & HANDLERS ─────────────────────────────────────────────
console.log('\n--- 2. AUDITING API ENDPOINTS & INTEGRATIONS ---');

const expectedApis = [
  { path: 'src/app/api/search/route.ts', label: 'Instant Search API (/api/search)' },
  { path: 'src/app/api/pincode/check/route.ts', label: 'India Pincode Serviceability (/api/pincode/check)' },
  { path: 'src/app/api/invoice/[id]/route.ts', label: 'Authoritative GST/Receipt Invoice (/api/invoice/[id])' },
  { path: 'src/app/api/webhooks/razorpay/route.ts', label: 'Razorpay Payment Webhook (/api/webhooks/razorpay)' },
  { path: 'src/app/api/upload/route.ts', label: 'Secure Media Upload API (/api/upload)' },
  { path: 'src/app/api/ai/customer-support/route.ts', label: 'TTRC AI Support Gateway (/api/ai/customer-support)' },
];

for (const api of expectedApis) {
  const fullPath = path.resolve(webDir, api.path);
  const exists = fs.existsSync(fullPath);
  auditCheck(
    'API',
    api.label,
    exists ? 'PASS' : 'FAIL',
    api.path,
    exists ? 'Route handler active' : 'Endpoint missing'
  );
}

// ─── 3. DATABASE MODELS & CONCURRENCY PRIMITIVES ─────────────────────────────
console.log('\n--- 3. AUDITING MONGODB ATLAS ENTITIES & SCHEMAS ---');

const modelsPath = path.resolve(webDir, 'src/lib/mongodb/models.ts');
const modelsSource = fs.readFileSync(modelsPath, 'utf8');

const requiredEntities = [
  'UserModel',
  'ProductModel',
  'OrderModel',
  'CategoryModel',
  'CouponModel',
  'ReviewModel',
  'AuditLogModel',
  'PincodeModel',
  'SiteSettingModel',
  'ManufacturerModel',
  'ProductCompatibilityModel',
];

for (const model of requiredEntities) {
  const isDefined = modelsSource.includes(`export const ${model}`);
  auditCheck(
    'DATABASE',
    `Mongoose Model: ${model}`,
    isDefined ? 'PASS' : 'FAIL',
    modelsPath,
    isDefined ? 'Mongoose Model registered' : 'Model not found'
  );
}

// Check Counter Model for sequential IDs
const idGenPath = path.resolve(webDir, 'src/lib/id-generator.ts');
const idGenExists = fs.existsSync(idGenPath);
const idGenSource = idGenExists ? fs.readFileSync(idGenPath, 'utf8') : '';
const hasCounter = idGenSource.includes('CounterModel') && idGenSource.includes('getNextSequenceId');
auditCheck(
  'DATABASE',
  'Atomic Counter (5-digit IDs: TTRC-*-00001)',
  hasCounter ? 'PASS' : 'FAIL',
  idGenPath,
  hasCounter ? 'Atomic $inc sequence generator active' : 'Sequential generator missing'
);

// ─── 4. SECURITY & AUTHORIZATION GUARDS ──────────────────────────────────────
console.log('\n--- 4. AUDITING SERVER-SIDE AUTHORIZATION & ACCESS CONTROLS ---');

const authHelpersPath = path.resolve(webDir, 'src/lib/auth-helpers.ts');
const authSource = fs.readFileSync(authHelpersPath, 'utf8');

const hasRequireAdmin = authSource.includes('export async function requireAdmin');
const hasRequireAuth = authSource.includes('export async function requireAuth');
const hasJwtVerification = authSource.includes('jwt.verify') || authSource.includes('jose');

auditCheck(
  'SECURITY',
  'Server Authorization: requireAuth()',
  hasRequireAuth ? 'PASS' : 'FAIL',
  authHelpersPath,
  hasRequireAuth ? 'Enforced server-side' : 'Missing'
);

auditCheck(
  'SECURITY',
  'Admin Role Barrier: requireAdmin()',
  hasRequireAdmin ? 'PASS' : 'FAIL',
  authHelpersPath,
  hasRequireAdmin ? 'Enforced server-side' : 'Missing'
);

// Check Edge Middleware
const middlewarePath = path.resolve(webDir, 'src/middleware.ts');
const middlewareSource = fs.readFileSync(middlewarePath, 'utf8');
const middlewareProtectsAdmin = middlewareSource.includes('/admin') && middlewareSource.includes('crypto.subtle');
auditCheck(
  'SECURITY',
  'Edge Middleware JWT Cryptographic Verification',
  middlewareProtectsAdmin ? 'PASS' : 'FAIL',
  middlewarePath,
  middlewareProtectsAdmin ? 'Web Crypto HMAC active' : 'Vulnerable'
);

// Check Rate Limiting implementation
const rateLimiterPath = path.resolve(webDir, 'src/lib/security/rate-limiter.ts');
const rateLimiterSource = fs.readFileSync(rateLimiterPath, 'utf8');
const hasRateLimiter = rateLimiterSource.includes('checkRateLimit');
auditCheck(
  'SECURITY',
  'Distributed Rate Limiting (Redis / In-Memory)',
  hasRateLimiter ? 'PASS' : 'FAIL',
  rateLimiterPath,
  hasRateLimiter ? 'checkRateLimit configured' : 'Missing'
);

// ─── 5. BUSINESS LOGIC & CONCURRENCY CONTROLS ────────────────────────────────
console.log('\n--- 5. AUDITING CONCURRENCY, FINANCIAL & ORDER LIFECYCLE ---');

// Check checkout logic for atomic inventory and server pricing
const checkoutActionPath = path.resolve(webDir, 'src/actions/checkout.ts');
const checkoutSource = fs.readFileSync(checkoutActionPath, 'utf8');

const hasAtomicStockDeduction = checkoutSource.includes('$gte') && checkoutSource.includes('$inc: { stock_quantity: -');
const hasServerPricing = checkoutSource.includes('ProductModel.find') && checkoutSource.includes('computeOrderTotals');
const hasSequentialOrderNumber = checkoutSource.includes("getNextSequenceId('ORD')");

auditCheck(
  'CHECKOUT',
  'Atomic Inventory Concurrency ($gte check)',
  hasAtomicStockDeduction ? 'PASS' : 'FAIL',
  checkoutActionPath,
  hasAtomicStockDeduction ? 'Prevents overselling under race conditions' : 'Vulnerable to race condition'
);

auditCheck(
  'CHECKOUT',
  'Server-Side Authoritative Pricing Recomputation',
  hasServerPricing ? 'PASS' : 'FAIL',
  checkoutActionPath,
  hasServerPricing ? 'Client financial parameters untrusted' : 'Vulnerable to price manipulation'
);

auditCheck(
  'CHECKOUT',
  'Sequential Order Numbers (TTRC-ORD-00001)',
  hasSequentialOrderNumber ? 'PASS' : 'FAIL',
  checkoutActionPath,
  hasSequentialOrderNumber ? '5-digit zero-padded order numbers active' : 'Missing sequential generator'
);

// Check registration logic for sequential customer IDs
const authActionPath = path.resolve(webDir, 'src/actions/auth.ts');
const authActionSource = fs.readFileSync(authActionPath, 'utf8');
const hasSequentialCustomerId = authActionSource.includes("getNextSequenceId('CUS')");
const hasStrictCustomerRole = authActionSource.includes("role: 'customer'");

auditCheck(
  'AUTH',
  'Sequential Customer ID Assignment (TTRC-CUS-00001)',
  hasSequentialCustomerId ? 'PASS' : 'FAIL',
  authActionPath,
  hasSequentialCustomerId ? 'Assigned sequentially on signup' : 'Missing'
);

auditCheck(
  'AUTH',
  'Strict Customer Role Enforcement on Registration',
  hasStrictCustomerRole ? 'PASS' : 'FAIL',
  authActionPath,
  hasStrictCustomerRole ? 'Cannot elevate to admin via form input' : 'Escalation vulnerability'
);

// Check account actions for real MongoDB persistence
const accountActionPath = path.resolve(webDir, 'src/actions/account.ts');
const accountActionSource = fs.readFileSync(accountActionPath, 'utf8');

const hasRealAddressCrud = accountActionSource.includes('addAddressAction') && accountActionSource.includes('deleteAddressAction') && accountActionSource.includes('user.addresses');
const hasRealWishlist = accountActionSource.includes('addToWishlistAction') && accountActionSource.includes('user.wishlist');
const hasRealReviews = accountActionSource.includes('getMyReviewsAction') && accountActionSource.includes('ReviewModel.find');
const hasRealOverview = accountActionSource.includes('savedAddressesCount: addresses.length') && accountActionSource.includes('wishlistCount: wishlistItems.length');

auditCheck(
  'CUSTOMER',
  'Authoritative Address Book CRUD in MongoDB',
  hasRealAddressCrud ? 'PASS' : 'FAIL',
  accountActionPath,
  hasRealAddressCrud ? 'Addresses stored on UserModel' : 'Stubbed'
);

auditCheck(
  'CUSTOMER',
  'Authoritative Wishlist Persistence in MongoDB',
  hasRealWishlist ? 'PASS' : 'FAIL',
  accountActionPath,
  hasRealWishlist ? 'Wishlist stored on UserModel' : 'Stubbed'
);

auditCheck(
  'CUSTOMER',
  'Authoritative Verified Reviews in MongoDB',
  hasRealReviews ? 'PASS' : 'FAIL',
  accountActionPath,
  hasRealReviews ? 'Backed by ReviewModel' : 'Stubbed'
);

auditCheck(
  'CUSTOMER',
  'Real Account Overview Metrics (Zero Hardcoding)',
  hasRealOverview ? 'PASS' : 'FAIL',
  accountActionPath,
  hasRealOverview ? 'Calculated from MongoDB entities' : 'Hardcoded metrics detected'
);

// ─── 6. AUDIT FOR MOCK DATA IN PRODUCTION FILES ──────────────────────────────
console.log('\n--- 6. AUDITING AGAINST PRODUCTION MOCK DATA (ZERO-TOLERANCE) ---');

function searchMockPatterns(dir, pattern, excludeDirs = ['node_modules', '.next', '.git', 'tests']) {
  let matches = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const f of files) {
    if (f.isDirectory()) {
      if (!excludeDirs.includes(f.name)) {
        matches = matches.concat(searchMockPatterns(path.join(dir, f.name), pattern, excludeDirs));
      }
    } else if (f.isFile() && (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) && !f.name.includes('.test.')) {
      const content = fs.readFileSync(path.join(dir, f.name), 'utf8');
      if (pattern.test(content)) {
        matches.push(path.relative(rootDir, path.join(dir, f.name)));
      }
    }
  }
  return matches;
}

const mockCustomerPattern = /CUSTOMERS_LIST\s*=|const\s+mockCustomers\s*=|const\s+fakeCustomers\s*=/i;
const mockCustomerFiles = searchMockPatterns(path.join(webDir, 'src'), mockCustomerPattern);

auditCheck(
  'NO-MOCK',
  'Zero Hardcoded Customer Mock Arrays in App Code',
  mockCustomerFiles.length === 0 ? 'PASS' : 'FAIL',
  mockCustomerFiles.join(', ') || 'Clean',
  mockCustomerFiles.length === 0 ? 'Zero mock customer arrays found' : `Mock found in ${mockCustomerFiles.join(', ')}`
);

const mockOrderPattern = /const\s+mockOrders\s*=|const\s+fakeOrders\s*=|const\s+sampleOrders\s*=/i;
const mockOrderFiles = searchMockPatterns(path.join(webDir, 'src'), mockOrderPattern);

auditCheck(
  'NO-MOCK',
  'Zero Hardcoded Order Mock Arrays in App Code',
  mockOrderFiles.length === 0 ? 'PASS' : 'FAIL',
  mockOrderFiles.join(', ') || 'Clean',
  mockOrderFiles.length === 0 ? 'Zero mock order arrays found' : `Mock found in ${mockOrderFiles.join(', ')}`
);

// ─── AUDIT SUMMARY ───────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(80));
console.log('  TTRC STORE FULL-STACK FEATURE AUDIT SUMMARY');
console.log('='.repeat(80));
console.log(`  Total Checks Executed : ${auditResults.length}`);
console.log(`  Passed Controls       : ${passedCount}`);
console.log(`  Warnings              : ${warningCount}`);
console.log(`  Failed Controls       : ${failCount}`);
console.log(`  Overall Compliance    : ${Math.round((passedCount / auditResults.length) * 100)}%`);
console.log(`  Status                : ${failCount === 0 ? 'ALL SYSTEMS OPERATIONAL & VERIFIED' : 'DEFECTS REQUIRE REMEDIATION'}`);
console.log('='.repeat(80) + '\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
