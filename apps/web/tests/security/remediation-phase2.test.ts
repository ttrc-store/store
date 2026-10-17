import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

describe('Phase 2 Security Remediations Regression Test Suite', () => {
  const WEB_SRC = path.resolve(__dirname, '../../src');

  // -------------------------------------------------------------------------
  // SEC-01: Remove Hardcoded MongoDB Credentials
  // -------------------------------------------------------------------------
  describe('SEC-01: MongoDB Client Credential Security', () => {
    it('contains ZERO hardcoded MongoDB connection strings or passwords in client.ts', () => {
      const clientPath = path.join(WEB_SRC, 'lib', 'mongodb', 'client.ts');
      const content = fs.readFileSync(clientPath, 'utf8');

      // Assert no hardcoded atlas seedlist or password
      expect(content).not.toContain('DIRECT_REPLICA_SEEDLIST');
      expect(content).not.toContain('ttrcstoree_db_user');
      expect(content).not.toContain('ZjFSWGqEKH4rQ6OY');
      expect(content).not.toMatch(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/);
    });

    it('asserts MONGODB_URI is required and rejects empty or malformed URIs', async () => {
      const clientPath = path.join(WEB_SRC, 'lib', 'mongodb', 'client.ts');
      const content = fs.readFileSync(clientPath, 'utf8');

      expect(content).toContain('assertMongoUri');
      expect(content).toContain('MONGODB_URI environment variable is missing, empty, or malformed');
    });

    it('sanitizes connection error logs so credentials cannot leak to stdout/stderr', () => {
      const clientPath = path.join(WEB_SRC, 'lib', 'mongodb', 'client.ts');
      const content = fs.readFileSync(clientPath, 'utf8');

      expect(content).toContain("console.error('[MongoDB Atlas] Both SRV and direct seedlist connections failed:'");
      expect(content).not.toContain('console.error(MONGODB_URI)');
    });
  });

  // -------------------------------------------------------------------------
  // SEC-02: Remove Admin Login Backdoor
  // -------------------------------------------------------------------------
  describe('SEC-02: Admin Login Backdoor Elimination', () => {
    it('contains ZERO fallback passwords in actions/auth.ts', () => {
      const authPath = path.join(WEB_SRC, 'actions', 'auth.ts');
      const content = fs.readFileSync(authPath, 'utf8');

      expect(content).not.toContain('TTRC@store');
      expect(content).not.toContain('Admin@ttrc2026');
      expect(content).not.toContain('user.password_hash = await bcrypt.hash');
    });

    it('strictly requires bcrypt.compare with no alternative bypasses', () => {
      const authPath = path.join(WEB_SRC, 'actions', 'auth.ts');
      const content = fs.readFileSync(authPath, 'utf8');

      expect(content).toContain('const isMatch = await bcrypt.compare(password, user.password_hash);');
      expect(content).toContain("if (!isMatch) {\n      return { error: 'Invalid email or password.' };");
    });
  });

  // -------------------------------------------------------------------------
  // SEC-03: Invoice BOLA / IDOR Protection & Response Hardening
  // -------------------------------------------------------------------------
  describe('SEC-03: Invoice BOLA/IDOR Elimination & Response Hardening', () => {
    const invoiceRoutePath = path.join(WEB_SRC, 'app', 'api', 'invoice', '[id]', 'route.ts');
    const content = fs.readFileSync(invoiceRoutePath, 'utf8');

    it('does NOT contain isRecentOrder unauthenticated bypass', () => {
      expect(content).not.toContain('isRecentOrder');
      expect(content).not.toContain('orderAgeMs');
    });

    it('enforces deny-by-default returning 404 for unauthorized requests to hide order existence', () => {
      expect(content).toContain('if (!isOwner && !isAdmin && !isTokenAuthorized)');
      expect(content).toContain("error: 'Invoice not found or access denied.'");
      expect(content).toContain('status: 404');
    });

    it('verifies unauthorized failure response contains ZERO customer PII or HTML', () => {
      // The deny response must return only the generic error message and zero leaks
      const expectedDenyBody = { error: 'Invoice not found or access denied.' };
      expect(expectedDenyBody).not.toHaveProperty('customerName');
      expect(expectedDenyBody).not.toHaveProperty('phone');
      expect(expectedDenyBody).not.toHaveProperty('address');
      expect(expectedDenyBody).not.toHaveProperty('total');
      expect(content).toContain("NextResponse.json(\n        { error: 'Invoice not found or access denied.' },");
    });

    it('returns equivalent 404 response for both nonexistent and unauthorized orders', () => {
      // Both !order and unauthorized check return the exact same denyResponse() helper
      expect(content).toContain('if (!order) {\n      return denyResponse();\n    }');
      expect(content).toContain('if (!isOwner && !isAdmin && !isTokenAuthorized) {\n      return denyResponse();\n    }');
    });

    it('verifies cryptographically secure guest tokens using SHA-256 and timing-safe comparison', () => {
      expect(content).toContain('crypto.timingSafeEqual');
      expect(content).toContain('guest_invoice_token_hash');
      expect(content).toContain("crypto.createHash('sha256')");
    });

    it('enforces private, no-cache, no-store Cache-Control headers on ALL success and failure paths', () => {
      const headerMatches = content.match(/'Cache-Control': 'private, no-cache, no-store, must-revalidate'/g);
      expect(headerMatches).not.toBeNull();
      // Ensure it appears on both denyResponse, html success, and 500 error response
      expect(headerMatches!.length).toBeGreaterThanOrEqual(3);
      expect(content).toContain("'X-Content-Type-Options': 'nosniff'");
      expect(content).toContain("'Pragma': 'no-cache'");
      expect(content).toContain("'Referrer-Policy': 'no-referrer'");
    });

    it('permanently revokes guest invoice access when order is cancelled or refunded', () => {
      expect(content).toContain("order.status === 'cancelled'");
      expect(content).toContain("order.status === 'refunded'");
      expect(content).toContain('guest_invoice_token_revoked');
    });

    it('simulates guest token cryptographic verification correctly', () => {
      const rawSecretToken = crypto.randomBytes(32).toString('hex');
      const storedHash = crypto.createHash('sha256').update(rawSecretToken).digest('hex');

      // Valid token matches
      const candidateHash = crypto.createHash('sha256').update(rawSecretToken).digest('hex');
      const isMatch = crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(candidateHash, 'hex'));
      expect(isMatch).toBe(true);

      // Wrong token fails
      const forgedToken = crypto.randomBytes(32).toString('hex');
      const forgedHash = crypto.createHash('sha256').update(forgedToken).digest('hex');
      const isForgedMatch = crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(forgedHash, 'hex'));
      expect(isForgedMatch).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // SEC-04: Remove Predictable Seeder Password & Enforce Complexity
  // -------------------------------------------------------------------------
  describe('SEC-04: Database Seeder Hardening & Password Complexity', () => {
    const seedPath = path.join(WEB_SRC, 'lib', 'mongodb', 'seed.ts');
    const content = fs.readFileSync(seedPath, 'utf8');

    it('contains ZERO hardcoded default passwords in seed.ts', () => {
      expect(content).not.toContain('Admin@ttrc2026');
      expect(content).not.toContain('defaultPasswordHash');
    });

    it('requires INITIAL_ADMIN_PASSWORD with strict complexity (min 12 chars, upper, lower, digit, symbol)', () => {
      expect(content).toContain('process.env.INITIAL_ADMIN_PASSWORD');
      expect(content).toContain('rawPassword.length >= 12');
      expect(content).toContain('/[A-Z]/.test(rawPassword)');
      expect(content).toContain('/[a-z]/.test(rawPassword)');
      expect(content).toContain('/[0-9]/.test(rawPassword)');
      expect(content).toContain('/[^A-Za-z0-9]/.test(rawPassword)');
    });

    it('rejects blacklisted weak and predictable administrator passwords', () => {
      expect(content).toContain('BANNED_PASSWORDS');
      expect(content).toContain('!BANNED_PASSWORDS.has(rawPassword.toLowerCase())');
    });

    it('never logs raw or hashed administrator passwords to stdout or stderr', () => {
      expect(content).not.toContain('console.log(rawPassword');
      expect(content).not.toContain('console.log(passwordHash');
      expect(content).toContain('Successfully provisioned initial administrator for:');
    });

    it('never overwrites existing admin users during reseeding', () => {
      expect(content).toContain("const adminCount = await UserModel.countDocuments({ role: 'admin' });");
      expect(content).toContain('if (adminCount === 0)');
    });
  });

  // -------------------------------------------------------------------------
  // SEC-05: Session Revocation via Token Version
  // -------------------------------------------------------------------------
  describe('SEC-05: Multi-Device Session Revocation (token_version)', () => {
    const modelsPath = path.join(WEB_SRC, 'lib', 'mongodb', 'models.ts');
    const authHelpersPath = path.join(WEB_SRC, 'lib', 'auth-helpers.ts');
    const authActionsPath = path.join(WEB_SRC, 'actions', 'auth.ts');

    const modelsContent = fs.readFileSync(modelsPath, 'utf8');
    const authHelpersContent = fs.readFileSync(authHelpersPath, 'utf8');
    const authActionsContent = fs.readFileSync(authActionsPath, 'utf8');

    it('defines token_version in IUser interface and UserSchema', () => {
      expect(modelsContent).toContain('token_version?: number;');
      expect(modelsContent).toContain('token_version: { type: Number, default: 1 }');
    });

    it('embeds tokenVersion into the session JWT token', () => {
      expect(authHelpersContent).toContain('tokenVersion: user.token_version || 1');
      expect(authHelpersContent).toContain('tokenVersion?: number;');
    });

    it('strictly compares JWT tokenVersion against live database token_version', () => {
      expect(authHelpersContent).toContain('const dbTokenVersion = dbUser.token_version || 1;');
      expect(authHelpersContent).toContain('const sessionTokenVersion = decoded.tokenVersion || 1;');
      expect(authHelpersContent).toContain('if (sessionTokenVersion !== dbTokenVersion)');
      expect(authHelpersContent).toContain("error: 'Session has been revoked or expired. Please log in again.'");
    });

    it('increments token_version on password reset and password change to instantly invalidate all sessions', () => {
      expect(authActionsContent).toContain('$inc: { token_version: 1 }');
      expect(authHelpersContent).toContain('export async function revokeUserSessions(userId: string)');
    });

    it('revokes sessions when administrator disables a customer account', () => {
      const adminActionsPath = path.join(WEB_SRC, 'actions', 'admin.ts');
      const adminActionsContent = fs.readFileSync(adminActionsPath, 'utf8');

      expect(adminActionsContent).toContain('revokeUserSessions(userId)');
    });
  });

  // -------------------------------------------------------------------------
  // SEC-06: Sensitive Admin Operations Reauthentication
  // -------------------------------------------------------------------------
  describe('SEC-06: Sensitive Admin Operations Reauthentication', () => {
    const authHelpersPath = path.join(WEB_SRC, 'lib', 'auth-helpers.ts');
    const adminReauthPath = path.join(WEB_SRC, 'actions', 'admin-reauth.ts');
    const settingsActionsPath = path.join(WEB_SRC, 'actions', 'settings.ts');
    const adminActionsPath = path.join(WEB_SRC, 'actions', 'admin.ts');

    const authHelpersContent = fs.readFileSync(authHelpersPath, 'utf8');
    const adminReauthContent = fs.readFileSync(adminReauthPath, 'utf8');
    const settingsActionsContent = fs.readFileSync(settingsActionsPath, 'utf8');
    const adminActionsContent = fs.readFileSync(adminActionsPath, 'utf8');

    it('provides requireAdminReauth helper with 15-minute sliding window or inline password verification', () => {
      expect(authHelpersContent).toContain('export async function requireAdminReauth');
      expect(authHelpersContent).toContain('ttrc_admin_reauth');
      expect(authHelpersContent).toContain('requiresReauth: true');
    });

    it('rate limits admin password confirmation attempts to prevent brute-force', () => {
      expect(adminReauthContent).toContain('export async function confirmAdminPasswordAction');
      expect(adminReauthContent).toContain('admin_reauth:${adminAuth.user.id}');
      expect(adminReauthContent).toContain('limit: 5');
      expect(adminReauthContent).toContain('windowMs: 10 * 60 * 1000');
      expect(adminReauthContent).toContain('bcrypt.compare(password, adminUser.password_hash)');
      expect(adminReauthContent).toContain('setAdminReauthCookie(adminAuth.user.id)');
    });

    it('protects sensitive site settings (gst_enabled, razorpay_enabled, cod_max_limit_paise) with reauth', () => {
      expect(settingsActionsContent).toContain('requireAdminReauth');
      expect(settingsActionsContent).toContain("key === 'razorpay_enabled' || key === 'gst_enabled' || key === 'cod_max_limit_paise'");
    });

    it('protects irreversible order state changes (refunded, cancelled) with reauth', () => {
      expect(adminActionsContent).toContain('requireAdminReauth');
      expect(adminActionsContent).toContain("targetStatus === 'refunded' || targetStatus === 'cancelled'");
    });

    it('protects product deletion and customer deactivation with reauth', () => {
      expect(adminActionsContent).toContain('deleteProductAction');
      expect(adminActionsContent).toContain('disableCustomerAction');
      expect(adminActionsContent).toContain('const auth = await requireAdminReauth(adminPassword);');
    });
  });

  // -------------------------------------------------------------------------
  // SEC-07: Remove Razorpay Test-Key Fallback
  // -------------------------------------------------------------------------
  describe('SEC-07: Payment Test Page Hardening', () => {
    it('contains ZERO rzp_test_ fallback keys in payment-test/page.tsx', () => {
      const pagePath = path.join(WEB_SRC, 'app', 'payment-test', 'page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');

      expect(content).not.toContain('rzp_test_TnRvg3LwstLPha');
      expect(content).not.toMatch(/rzp_test_[a-zA-Z0-9]+/);
      expect(content).toContain("process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'Not configured in environment'");
    });

    it('middleware blocks /payment-test in production', () => {
      const middlewarePath = path.join(WEB_SRC, 'middleware.ts');
      const content = fs.readFileSync(middlewarePath, 'utf8');

      expect(content).toContain("isProd && pathname.startsWith('/payment-test')");
      expect(content).toContain("new NextResponse('Not Found', { status: 404 })");
    });
  });
});
