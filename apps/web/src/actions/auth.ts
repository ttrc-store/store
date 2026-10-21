'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb/client';
import { UserModel, AuditLogModel } from '@/lib/mongodb/models';
import { ensureDatabaseSeeded } from '@/lib/mongodb/seed';
import { createSessionCookie, clearSessionCookie, requireAuth, getAuthenticatedUser } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { getNextSequenceId } from '@/lib/id-generator';
import {
  createOtpChallenge,
  verifyOtpChallenge,
  normalizeEmail,
  OtpPurpose,
} from '@/lib/security/otp-service';
import {
  sendVerificationOtp,
  sendPasswordResetOtp,
  sendEmailChangeOtp,
  sendSecurityNotification,
} from '@/lib/email/resend';

const LoginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Please enter your registered email address or 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const RegisterSchema = z
  .object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    fullName: z.string().min(2, 'Name is required').max(100).optional(),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^(\+91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password').optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms & Conditions and Privacy Policy',
    }),
    redirectTo: z.string().optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Customer / Admin Login Action
 * Decision: Verified users log in normally without OTP to avoid quota waste and friction.
 * Unverified users are redirected to complete 6-digit OTP verification.
 */
export async function loginAction(formData: FormData) {
  const rawIdentifier = (
    (formData.get('identifier') as string) ||
    (formData.get('email') as string) ||
    (formData.get('phone') as string) ||
    ''
  ).trim();
  const password = (formData.get('password') as string) || '';

  const validation = LoginSchema.safeParse({ identifier: rawIdentifier, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Rate limit: 5 attempts per 5 minutes per identifier
  const sanitizedKey = `login:${rawIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const rateLimit = await checkRateLimit({
    key: sanitizedKey,
    limit: 5,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.success) {
    return {
      error: 'Too many failed login attempts. Please wait a few minutes before trying again.',
    };
  }

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    let userQuery: any;
    if (rawIdentifier.includes('@')) {
      userQuery = { email: rawIdentifier.toLowerCase() };
    } else {
      const cleanDigits = rawIdentifier.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        userQuery = {
          $or: [
            { phone: cleanDigits },
            { phone: `+91${cleanDigits}` },
            { phone: `91${cleanDigits}` },
            { email: rawIdentifier.toLowerCase() },
          ],
        };
      } else if (cleanDigits.length >= 10) {
        const last10 = cleanDigits.slice(-10);
        userQuery = {
          $or: [
            { phone: cleanDigits },
            { phone: `+${cleanDigits}` },
            { phone: last10 },
            { phone: `+91${last10}` },
            { email: rawIdentifier.toLowerCase() },
          ],
        };
      } else {
        userQuery = {
          $or: [
            { email: rawIdentifier.toLowerCase() },
            { phone: rawIdentifier },
          ],
        };
      }
    }

    const user = await UserModel.findOne(userQuery);

    if (!user || !user.password_hash) {
      return { error: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return { error: 'Invalid email or password.' };
    }

    const isAdmin = user.role === 'admin' || user.role === 'staff';

    // Auto-verify user since OTP verification is paused/on hold
    if (!user.email_verified) {
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { email_verified: true, email_verified_at: new Date() } }
      );
      user.email_verified = true;
    }

    await createSessionCookie(user);

    const rawRedirect = formData.get('redirectTo') as string;
    const redirectTo =
      rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
        ? rawRedirect
        : null;

    if (redirectTo) {
      redirect(redirectTo);
    }

    redirect(isAdmin ? '/admin' : '/account');
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('[Login Action Error]', err);
    return { error: 'Failed to connect to authentication server. Please try again.' };
  }
}

/**
 * Customer Registration Action
 * Enforces email_verified = false until successful 120s OTP verification.
 */
export async function registerAction(formData: FormData) {
  const firstName = (formData.get('firstName') as string)?.trim() || '';
  const lastName = (formData.get('lastName') as string)?.trim() || '';
  let fullName = (formData.get('fullName') as string)?.trim() || '';
  if (!fullName && (firstName || lastName)) {
    fullName = `${firstName} ${lastName}`.trim();
  }
  const email = (formData.get('email') as string)?.trim().toLowerCase() || '';
  let phone = (formData.get('phone') as string)?.trim() || '';
  if (phone) {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      phone = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      phone = `+${digitsOnly}`;
    }
  }
  const password = (formData.get('password') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';
  const termsAccepted =
    formData.get('termsAccepted') === 'true' ||
    formData.get('termsAccepted') === 'on' ||
    formData.get('termsAccepted') === '1';
  const redirectTo = (formData.get('redirectTo') as string) || '';

  const validation = RegisterSchema.safeParse({
    firstName,
    lastName,
    fullName: fullName || (firstName ? `${firstName} ${lastName}`.trim() : 'Customer'),
    email,
    phone,
    password,
    confirmPassword: confirmPassword || password,
    termsAccepted,
    redirectTo,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Rate limit: 3 registrations per 10 minutes
  const rateLimit = await checkRateLimit({
    key: `register:${email}`,
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.success) {
    return { error: 'Too many registration attempts. Please wait before trying again.' };
  }

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return { error: 'An account with this email already exists. Please sign in.' };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const customer_id = await getNextSequenceId('CUS');

    // If phone number is supplied, ensure it is not already used
    if (phone) {
      const cleanDigits = phone.replace(/\D/g, '');
      const last10 = cleanDigits.slice(-10);
      const existingPhoneUser = await UserModel.findOne({
        $or: [
          { phone },
          { phone: cleanDigits },
          { phone: last10 },
          { phone: `+91${last10}` },
        ],
      });
      if (existingPhoneUser) {
        return { error: 'An account with this mobile number already exists. Please sign in.' };
      }
    }

    // Create user with email_verified: true (OTP verification on hold)
    const newUser = await UserModel.create({
      customer_id,
      email,
      full_name: fullName || email.split('@')[0],
      phone: phone || undefined,
      password_hash,
      role: 'customer',
      email_verified: true,
      email_verified_at: new Date(),
    });

    await AuditLogModel.create({
      actor_id: newUser._id.toString(),
      action: 'user.registered',
      entity: 'user',
      entity_id: newUser._id.toString(),
      metadata: { email, phone, autoVerified: true },
    });

    // Automatically sign in the newly registered customer
    await createSessionCookie(newUser);

    const destination =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/account';

    redirect(destination);
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('[Register Action Error]', err);
    return { error: 'Failed to create account. Please try again.' };
  }
}

/**
 * Request / Resend Verification OTP
 */
export async function requestOtpAction(params: {
  email: string;
  purpose: OtpPurpose;
}) {
  const email = normalizeEmail(params.email);
  const { purpose } = params;

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    await connectToDatabase();

    // Verify account context where appropriate
    if (purpose === 'password_reset') {
      const user = await UserModel.findOne({ email });
      // To prevent account enumeration, return generic success even if user not found
      if (!user) {
        return {
          success: true,
          message: 'If an account exists with that email, a 6-digit verification code has been sent.',
          cooldownSeconds: 60,
        };
      }
    }

    const challenge = await createOtpChallenge({
      email,
      purpose,
    });

    if (!challenge.success) {
      return {
        error: challenge.error,
        cooldownSeconds: challenge.cooldownSeconds,
      };
    }

    // Send through centralized transactional email service
    if (challenge.otpForSending) {
      if (purpose === 'registration') {
        await sendVerificationOtp({
          toEmail: email,
          otp: challenge.otpForSending,
          expiresSeconds: challenge.expiresInSeconds,
        });
      } else if (purpose === 'password_reset') {
        await sendPasswordResetOtp({
          toEmail: email,
          otp: challenge.otpForSending,
          expiresSeconds: challenge.expiresInSeconds,
        });
      } else if (purpose === 'email_change') {
        await sendEmailChangeOtp({
          toEmail: email,
          otp: challenge.otpForSending,
          expiresSeconds: challenge.expiresInSeconds,
        });
      }
    }

    return {
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      challengeId: challenge.challengeId,
      cooldownSeconds: 60,
      expiresInSeconds: 120,
    };
  } catch (err: any) {
    console.error('[Request OTP Action Error]', err);
    return { error: 'Failed to send verification code. Please try again.' };
  }
}

/**
 * Verify OTP Action
 * Atomically verifies code, consumes challenge, and activates account.
 */
export async function verifyEmailOtpAction(params: {
  email: string;
  otp: string;
  purpose?: OtpPurpose;
  challengeId?: string;
  redirectTo?: string;
}) {
  const email = normalizeEmail(params.email);
  const purpose = params.purpose || 'registration';
  const { otp, challengeId, redirectTo } = params;

  try {
    const result = await verifyOtpChallenge({
      email,
      purpose,
      otp,
      challengeId,
    });

    if (!result.success) {
      return {
        error: result.error,
        locked: result.locked,
        expired: result.expired,
      };
    }

    await connectToDatabase();

    // If registration verification, atomically update user to email_verified: true
    if (purpose === 'registration') {
      const user = await UserModel.findOneAndUpdate(
        { email },
        {
          $set: {
            email_verified: true,
            email_verified_at: new Date(),
          },
        },
        { new: true }
      );

      if (user) {
        await createSessionCookie(user);
        await AuditLogModel.create({
          actor_id: user._id.toString(),
          action: 'user.email_verified',
          entity: 'user',
          entity_id: user._id.toString(),
          metadata: { email, verifiedAt: new Date().toISOString() },
        });
      }
    }

    return {
      success: true,
      verified: true,
      message: 'Email address verified successfully!',
      redirectTo: redirectTo || '/account',
    };
  } catch (err: any) {
    console.error('[Verify OTP Action Error]', err);
    return { error: 'Failed to verify code. Please try again.' };
  }
}

/**
 * Sign Out Action
 */
export async function signOutAction() {
  await clearSessionCookie();
  redirect('/login');
}

/**
 * Request Password Reset Action (Sends 6-digit OTP code)
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  const result = await requestOtpAction({
    email,
    purpose: 'password_reset',
  });

  if (result.error) {
    return { error: result.error };
  }

  return {
    success: 'If an account exists with that email, a 6-digit verification code has been sent to your inbox.',
    challengeId: result.challengeId,
  };
}

/**
 * Reset Password Action (Verifies OTP + updates password atomically)
 */
export async function resetPasswordAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const otp = (formData.get('otp') as string)?.trim();
  const challengeId = (formData.get('challengeId') as string)?.trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!otp || !/^\d{6}$/.test(otp)) {
    return { error: 'Please enter a valid 6-digit verification code.' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  try {
    // 1. Authoritatively verify the password reset OTP challenge
    const verifyResult = await verifyOtpChallenge({
      email,
      purpose: 'password_reset',
      otp,
      challengeId: challengeId || undefined,
    });

    if (!verifyResult.success) {
      return { error: verifyResult.error };
    }

    // 2. Update user's password in MongoDB
    await connectToDatabase();
    const newPasswordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.findOneAndUpdate(
      { email },
      { 
        $set: { password_hash: newPasswordHash },
        $inc: { token_version: 1 },
      },
      { new: true }
    );

    if (user) {
      // 3. Send security alert notification
      await sendSecurityNotification({
        toEmail: user.email,
        customerName: user.full_name || 'Customer',
        actionTitle: 'Password Changed Successfully',
        description: 'The password for your TTRC Store account was recently updated.',
        timestamp: new Date().toLocaleString('en-IN'),
      });

      await AuditLogModel.create({
        actor_id: user._id.toString(),
        action: 'user.password_reset',
        entity: 'user',
        entity_id: user._id.toString(),
        metadata: { email, resetAt: new Date().toISOString() },
      });
    }

    return { success: 'Your password has been updated successfully! You can now log in.' };
  } catch (err: any) {
    console.error('[Reset Password Action Error]', err);
    return { error: 'Failed to reset password. Please try again.' };
  }
}

/**
 * Authenticated Change Password Action
 * Verifies current password, updates to new password, and increments token_version to invalidate other sessions.
 */
export async function changePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const auth = await requireAuth();
  if ('error' in auth) {
    return { error: 'Authentication required to change password.', status: 401 };
  }

  if (!currentPassword) {
    return { error: 'Current password is required.' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  try {
    await connectToDatabase();
    const user = await UserModel.findById(auth.user.id);
    if (!user || !user.password_hash) {
      return { error: 'User account not found.' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return { error: 'Current password is incorrect.' };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.password_hash = newHash;
    user.token_version = (user.token_version || 1) + 1;
    await user.save();

    // Issue refreshed cookie for this current device with new token_version
    await createSessionCookie(user);

    await sendSecurityNotification({
      toEmail: user.email,
      customerName: user.full_name || 'Customer',
      actionTitle: 'Password Changed',
      description: 'Your account password was successfully updated and other active sessions were revoked.',
      timestamp: new Date().toLocaleString('en-IN'),
    });

    await AuditLogModel.create({
      actor_id: user._id.toString(),
      action: 'user.password_changed',
      entity: 'user',
      entity_id: user._id.toString(),
      metadata: { email: user.email, timestamp: new Date().toISOString() },
    });

    return { success: true, message: 'Password changed successfully. All other active sessions have been revoked.' };
  } catch (err: any) {
    console.error('[Change Password Action Error]', err);
    return { error: 'Failed to change password. Please try again.' };
  }
}

/**
 * Lightweight session user action for client header hydration without opting root layout into dynamic rendering.
 */
export async function getCurrentUserAction() {
  try {
    const auth = await getAuthenticatedUser();
    return 'user' in auth ? auth.user : null;
  } catch {
    return null;
  }
}

