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
  emailVerified?: boolean;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
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
    tokenVersion: user.token_version || 1,
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
        emailVerified: true,
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

    // Session Revocation (SEC-05): Invalidate sessions if tokenVersion does not match database
    const dbTokenVersion = dbUser.token_version || 1;
    const sessionTokenVersion = decoded.tokenVersion || 1;
    if (sessionTokenVersion !== dbTokenVersion) {
      return { error: 'Session has been revoked or expired. Please log in again.', status: 401 };
    }

    const isVerified =
      dbUser.role === 'admin' ||
      dbUser.role === 'staff' ||
      dbUser.email_verified === true;

    return {
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        role: dbUser.role,
        fullName: dbUser.full_name,
        emailVerified: isVerified,
      },
    };
  } catch {
    return { error: 'Unauthenticated', status: 401 };
  }
}

export async function requireVerifiedEmail(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const result = await getAuthenticatedUser();
  if ('error' in result) {
    return result;
  }
  if (!result.user.emailVerified) {
    return {
      error: 'Email verification required. Please verify your email address to access this feature.',
      status: 403,
    };
  }
  return result;
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
        emailVerified: true,
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

import bcrypt from 'bcryptjs';

export async function revokeUserSessions(userId: string): Promise<boolean> {
  await connectToDatabase();
  const res = await UserModel.findByIdAndUpdate(userId, { $inc: { token_version: 1 } });
  return Boolean(res);
}

const REAUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function setAdminReauthCookie(adminId: string) {
  const payload = {
    adminId,
    reauthAt: Date.now(),
    type: 'admin_reauth',
  };
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
  const cookieStore = await cookies();
  cookieStore.set('ttrc_admin_reauth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });
}

export async function requireAdminReauth(
  inlinePassword?: string
): Promise<{ user: AuthenticatedUser } | { error: string; status: number; requiresReauth: true }> {
  const isTestBypass = await checkTestBypass();
  if (isTestBypass) {
    return {
      user: {
        id: 'local-admin-id',
        email: 'admin@tamizhtech.in',
        role: 'admin',
        fullName: 'Store Admin',
        emailVerified: true,
      },
    };
  }

  const adminAuth = await requireAdmin();
  if ('error' in adminAuth) {
    return { ...adminAuth, requiresReauth: true };
  }

  // 1. If inline password is provided, verify it directly against DB
  if (inlinePassword && typeof inlinePassword === 'string') {
    await connectToDatabase();
    const dbAdmin = await UserModel.findById(adminAuth.user.id);
    if (dbAdmin && dbAdmin.password_hash) {
      const isMatch = await bcrypt.compare(inlinePassword, dbAdmin.password_hash);
      if (isMatch) {
        await setAdminReauthCookie(adminAuth.user.id);
        return adminAuth;
      }
    }
    return {
      error: 'Invalid administrator password confirmation.',
      status: 401,
      requiresReauth: true,
    };
  }

  // 2. Check for recent valid reauth cookie
  try {
    const cookieStore = await cookies();
    const reauthToken = cookieStore.get('ttrc_admin_reauth')?.value;
    if (reauthToken) {
      const decoded = jwt.verify(reauthToken, getJwtSecret()) as {
        adminId: string;
        reauthAt: number;
        type: string;
      };
      if (
        decoded.type === 'admin_reauth' &&
        decoded.adminId === adminAuth.user.id &&
        Date.now() - decoded.reauthAt < REAUTH_WINDOW_MS
      ) {
        return adminAuth;
      }
    }
  } catch {
    // Reauth cookie invalid or expired
  }

  return {
    error: 'Recent administrator reauthentication required. Please confirm your password to proceed.',
    status: 403,
    requiresReauth: true,
  };
}

export async function requireAuth(): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  return getAuthenticatedUser();
}
