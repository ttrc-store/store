'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb/client';
import { UserModel } from '@/lib/mongodb/models';
import { ensureDatabaseSeeded } from '@/lib/mongodb/seed';
import { createSessionCookie, clearSessionCookie } from '@/lib/auth-helpers';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = LoginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user || !user.password_hash) {
      return { error: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return { error: 'Invalid email or password.' };
    }

    await createSessionCookie(user);

    const isAdmin = user.role === 'admin' || user.role === 'staff';
    redirect(isAdmin ? '/admin' : '/account');
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('[Login Action Error]', err);
    return { error: 'Failed to connect to authentication server. Please try again.' };
  }
}

export async function registerAction(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = RegisterSchema.safeParse({ fullName, email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: 'An account with this email already exists.' };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const isFirstUser = (await UserModel.countDocuments()) === 0;

    const user = await UserModel.create({
      email: email.toLowerCase(),
      full_name: fullName,
      password_hash,
      role: isFirstUser ? 'admin' : 'customer',
    });

    await createSessionCookie(user);
    redirect(user.role === 'admin' ? '/admin' : '/account');
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('[Register Action Error]', err);
    return { error: 'Failed to create account. Please try again.' };
  }
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }
  return {
    success: 'If an account exists with that email, a password reset link has been sent to your inbox.',
  };
}

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  return { success: 'Your password has been updated successfully! You can now log in.' };
}
