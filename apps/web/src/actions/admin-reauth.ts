'use server';

import bcrypt from 'bcryptjs';
import { requireAdmin, setAdminReauthCookie } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { UserModel, AuditLogModel } from '@/lib/mongodb/models';
import { checkRateLimit } from '@/lib/security/rate-limiter';

/**
 * Confirm administrator password to unlock sensitive operations for a 15-minute sliding window (SEC-06).
 */
export async function confirmAdminPasswordAction(password: string) {
  const adminAuth = await requireAdmin();
  if ('error' in adminAuth) {
    return { error: adminAuth.error, status: adminAuth.status };
  }

  if (!password || typeof password !== 'string') {
    return { error: 'Password confirmation is required.' };
  }

  // Rate limit reauth attempts: 5 attempts per 10 minutes per admin
  const rateLimit = await checkRateLimit({
    key: `admin_reauth:${adminAuth.user.id}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.success) {
    return { error: 'Too many reauthentication attempts. Please wait 10 minutes.' };
  }

  try {
    await connectToDatabase();
    const adminUser = await UserModel.findById(adminAuth.user.id);
    if (!adminUser || !adminUser.password_hash) {
      return { error: 'Administrator account not found.' };
    }

    const isMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!isMatch) {
      await AuditLogModel.create({
        actor_id: adminAuth.user.id,
        action: 'admin.reauth_failed',
        entity: 'admin',
        entity_id: adminAuth.user.id,
        metadata: { timestamp: new Date().toISOString() },
      });
      return { error: 'Incorrect administrator password.' };
    }

    await setAdminReauthCookie(adminAuth.user.id);

    await AuditLogModel.create({
      actor_id: adminAuth.user.id,
      action: 'admin.reauth_success',
      entity: 'admin',
      entity_id: adminAuth.user.id,
      metadata: { timestamp: new Date().toISOString(), validForMinutes: 15 },
    });

    return { success: true, message: 'Administrator credentials verified successfully.' };
  } catch (err: any) {
    console.error('[Admin Reauth Error]', err);
    return { error: 'Failed to verify administrator credentials.' };
  }
}
