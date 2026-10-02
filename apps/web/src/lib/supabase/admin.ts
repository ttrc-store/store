/**
 * Supabase admin client — server-only, uses service-role key.
 * NEVER import this in client components or expose to the browser.
 * Service-role bypasses RLS; use only for privileged server operations.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || serviceRoleKey === 'placeholder_service_role_key') {
    throw new Error(
      '[TTRC Admin Client] SUPABASE_SERVICE_ROLE_KEY is missing or is the placeholder value. ' +
        'Set a real service-role key in your .env.local file.'
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
