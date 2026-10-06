/**
 * Next.js Server Instrumentation Hook
 * Executes on server initialization before accepting incoming traffic.
 */
import { assertProductionSecrets } from '@/lib/security/production-secrets-validator';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate secrets on server boot
    assertProductionSecrets();
  }
}
