    # TTRC Store — Production Security Release Gate
    **Platform:** TTRC Store (`ttrc.store` / `ttrc.shop`)  
    **Scope:** Pre-Deployment Production Security Release Evaluation  
    **Date:** October 17, 2026  
    **Current Evaluation Status:** **CONDITIONAL (Pending External Operator Action)**

    ---

    ## 1. Release Gate Criteria & Decision Framework

    The TTRC Store release gate evaluates whether the codebase and infrastructure are hardened against unauthorized access, payment fraud, account takeover, and data leaks before public release.

    Three release states are defined:
    - **PASS:** All critical security controls are implemented and verified in code, regression tests pass, and all external provider credentials have been verified and secured.
    - **CONDITIONAL:** Codebase security remediations are complete and verified by automated tests, but release to production requires a specific external administrative action (e.g. rotating an exposed Atlas password in provider console).
    - **BLOCK:** Critical authentication, authorization, payment integrity, or data-loss vulnerabilities remain unresolved in the application.

    ---

    ## 2. Release Gate Evaluation Matrix

    | Category | Control / Invariant Evaluated | Status | Verification Detail |
    | :--- | :--- | :--- | :--- |
    | **Database Security (SEC-01)** | Zero hardcoded connection strings or passwords in source code | **PASS (Code)** | Verified in `apps/web/src/lib/mongodb/client.ts`. Zero plaintext secrets in repo. |
    | **Database Security (SEC-01)** | Atlas user password rotated in MongoDB Atlas Console | **PENDING OPERATOR** | Mandatory operator action to rotate `ttrcstoree_db_user` password in MongoDB Atlas and update Vercel env. |
    | **Admin Identity (SEC-02)** | Zero fallback passwords or backdoor hash overrides | **PASS** | Removed lines 90–94 in `apps/web/src/actions/auth.ts`. Only bcrypt password hash verified. |
    | **Customer Data Isolation (SEC-03)** | Invoice BOLA/IDOR protection & elimination of `isRecentOrder` bypass | **PASS** | Strict owner/admin session check + high-entropy guest token with timing-safe SHA-256 comparison verified. |
    | **Seeder Hardening (SEC-04)** | Zero predictable admin passwords seeded | **PASS** | Default password hash removed from `seed.ts`. Seeding requires `INITIAL_ADMIN_PASSWORD` (min 10 chars). |
    | **Payment Hardening (SEC-07)** | Zero fallback `rzp_test_` keys in payment test page | **PASS** | Hardcoded test key removed from `payment-test/page.tsx`. Reads strictly from env. |
    | **Payment Integrity** | Server-authoritative amounts & timing-safe Razorpay webhook HMAC | **PASS** | Verified in `api/create-order` and `api/webhooks/razorpay`. Invariant `amount === order.total` enforced. |
    | **Inventory Concurrency** | Atomic conditional deduction (`$gte`) & rollback | **PASS** | Verified in `actions/checkout.ts`. Zero overselling race conditions. |
    | **Edge & HTTP Headers** | HSTS, CSP frame-ancestors none, X-Frame-Options DENY, nosniff | **PASS** | Configured in `apps/web/next.config.ts`. |
    | **Automated Test Coverage** | Regression tests & Comprehensive Audit | **PASS** | 207 unit/security tests pass (100%). `securityAudit.mjs` passes 38/38 checks (100%). |
    | **Production Build** | Static generation & Turbopack build | **PASS** | `pnpm build` succeeded in 49.8s across all 56 routes. |

    ---

    ## 3. Current Release State: CONDITIONAL

    ### Why the state is CONDITIONAL:
    The application source code is **100% remediated and tested**. However, because the MongoDB Atlas database user password was previously committed in historical commits prior to this cleanup, **deploying this code to production with the old Atlas password still active means the database is still exposed to anyone with access to past commit history**.

    ### Immediate Operator Action to achieve PASS:
    1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
    2. Change the password for the database user (or create `ttrc_app_user_v2`).
    3. Update `MONGODB_URI` in [Vercel Project Settings](https://vercel.com/).
    4. Delete the old user from MongoDB Atlas.
    5. Once complete, mark the release state **PASS** and proceed with deployment.

    ---

    ## 4. Pre-Deployment Operator Checklist

    - [x] SEC-01: Remove hardcoded DB credentials from application source code.
    - [x] SEC-02: Remove admin login backdoor from application source code.
    - [x] SEC-03: Close invoice BOLA/IDOR and enforce token-based/owner authorization.
    - [x] SEC-04: Remove default admin password from database seeder.
    - [x] SEC-07: Remove hardcoded test key from payment test page.
    - [x] Pass all unit, integration, and security regression tests (`pnpm test`).
    - [x] Verify production build passes cleanly (`pnpm build`).
    - [ ] **Operator:** Rotate database password in MongoDB Atlas Console.
    - [ ] **Operator:** Update `MONGODB_URI` in Vercel production environment variables.
    - [ ] **Operator:** Authorize final git push and deployment.
