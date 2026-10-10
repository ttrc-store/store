/**
 * Server-side authorization helpers backed by MongoDB Atlas.
 * Import these in Server Actions and Route Handlers to verify identity and roles.
 */
'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb/client';
import { UserModel, IUser } from './mongodb/models';
import { ensureDatabaseSeeded } from './mongodb/seed';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is missing in production');
    }
    return 'ttrc_store_jwt_secret_2026_key_secure_auth';
  }
  return secret;
}

export type UserRole = 'customer' | 'admin' | 'staff';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

async function checkTestBypass(): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const cookieStore = await cookies();
  const hasBypassCookie = cookieStore.get('ttrc_test_bypass')?.value === 'true';
  const isTestEnv = process.env.E2E_TEST === 'true' || process.env.ALLOW_TEST_BYPASS === 'true';
  return hasBypassCookie && isTestEnv;
}

export async function createSessionCookie(user: IUser) {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
  const cookieStore = await cookies();
  cookieStore.set('ttrc_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('ttrc_session');
}

export async function getAuthenticatedUser(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const isTestBypass = await checkTestBypass();
  if (isTestBypass) {
    return {
      user: {
        id: 'local-admin-id',
        email: 'admin@ttrc.store',
        role: 'admin',
        fullName: 'Store Admin',
      },
    };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ttrc_session')?.value;

    if (!token) {
      return { error: 'Unauthenticated', status: 401 };
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;

    await connectToDatabase();
    await ensureDatabaseSeeded();
    const dbUser = await UserModel.findById(decoded.userId).lean();

    if (!dbUser) {
      return { error: 'Unauthenticated', status: 401 };
    }

    return {
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        role: dbUser.role,
        fullName: dbUser.full_name,
      },
    };
  } catch {
    return { error: 'Unauthenticated', status: 401 };
  }
}

export async function requireAdmin(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const isTestBypass = await checkTestBypass();
  if (isTestBypass) {
    return {
      user: {
        id: 'local-admin-id',
        email: 'admin@tamizhtech.in',
        role: 'admin',
        fullName: 'Store Admin',
      },
    };
  }

  const result = await getAuthenticatedUser();
  if ('error' in result) {
    return result;
  }

  if (result.user.role !== 'admin' && result.user.role !== 'staff') {
    return { error: 'Forbidden: Admin or Staff role required', status: 403 };
  }

  return result;
}

export async function requireAuth(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  return getAuthenticatedUser();
}
