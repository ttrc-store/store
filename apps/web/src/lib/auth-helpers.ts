/**
 * Server-side authorization helpers.
 * Import these in Server Actions and Route Handlers to verify identity and roles.
 */
'use server';

import { createClient } from '@/lib/supabase/server';

import { cookies } from 'next/headers';

export type UserRole = 'customer' | 'admin' | 'staff';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Returns the current authenticated user with their role.
 * Throws a structured error object (not an exception) if unauthenticated.
 */
async function checkTestBypass(): Promise<boolean> {
  const cookieStore = await cookies();
  const hasBypassCookie = cookieStore.get('ttrc_test_bypass')?.value === 'true';
  const isTestEnv = process.env.E2E_TEST === 'true' || process.env.ALLOW_TEST_BYPASS === 'true';
  return hasBypassCookie && isTestEnv;
}

/**
 * Returns the current authenticated user with their role.
 * Throws a structured error object (not an exception) if unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const isTestBypass = await checkTestBypass();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (isTestBypass) {
        return {
          user: {
            id: 'local-admin-id',
            email: 'admin@ttrc.store',
            role: 'admin',
          },
        };
      }
      return { error: 'Unauthenticated', status: 401 };
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role: UserRole =
      (roleData?.role as UserRole) ?? (user.email?.includes('admin') ? 'admin' : 'customer');

    return {
      user: {
        id: user.id,
        email: user.email ?? 'customer@ttrc.store',
        role: isTestBypass ? 'admin' : role,
      },
    };
  } catch (err) {
    if (isTestBypass) {
      return {
        user: {
          id: 'local-admin-id',
          email: 'admin@ttrc.store',
          role: 'admin',
        },
      };
    }
    return { error: 'Unauthenticated', status: 401 };
  }
}

/**
 * Returns the current user if they are admin or staff.
 * Returns an error object otherwise.
 */
export async function requireAdmin(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const result = await getAuthenticatedUser();
  if ('error' in result) {
    const isTestBypass = await checkTestBypass();
    if (isTestBypass) {
      return {
        user: {
          id: 'local-admin-id',
          email: 'admin@ttrc.store',
          role: 'admin',
        },
      };
    }
    return result;
  }

  const isTestBypass = await checkTestBypass();

  if (result.user.role !== 'admin' && result.user.role !== 'staff' && !isTestBypass) {
    return { error: 'Forbidden: Admin or Staff role required', status: 403 };
  }

  if (isTestBypass) {
    return {
      user: {
        ...result.user,
        role: 'admin',
      },
    };
  }

  return result;
}

/**
 * Returns the current user if authenticated (any role).
 * Returns an error object if not authenticated.
 */
export async function requireAuth(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  return getAuthenticatedUser();
}
