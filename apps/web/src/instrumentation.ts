/**
 * Next.js Server Instrumentation Hook
 * Executes on server initialization before accepting incoming traffic.
 */
import { assertProductionSecrets } from '@/lib/security/production-secrets-validator';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Validate secrets on server boot
      assertProductionSecrets();
    } catch (err: any) {
      if (process.env.ENFORCE_PRODUCTION_SECRETS === 'true') {
        throw err;
      }
      console.warn('[Startup Secrets Warning]', err?.message || err);
    }
  }
}
