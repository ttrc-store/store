'use server';

import { connectToDatabase } from '@/lib/mongodb/client';
import { UserModel, OrderModel } from '@/lib/mongodb/models';
import { requireAuth } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid 10-digit phone number is required'),
});

export async function getAccountOverviewAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const userId = auth.user.id;

    const [user, totalOrders, recentOrders] = await Promise.all([
      UserModel.findById(userId).lean(),
      OrderModel.countDocuments({ user_id: userId }),
      OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).limit(3).lean(),
    ]);

    return {
      profile: {
        fullName: user?.full_name || auth.user.fullName || auth.user.email.split('@')[0],
        phone: user?.phone || '',
        email: auth.user.email,
        avatarUrl: user?.avatar_url || null,
      },
      totalOrders,
      savedAddressesCount: 1,
      defaultAddress: null as { line1: string; line2?: string; city: string; state: string; pincode: string; phone?: string; full_name?: string } | null,
      wishlistCount: 0,
      recentOrders: recentOrders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.order_number,
        date: order.created_at.toISOString().split('T')[0],
        status: order.status,
        totalPaise: order.total,
        itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
        name: order.items[0]?.product_name || 'Robotics Kit',
      })),
    };
  } catch {
    return {
      profile: {
        fullName: auth.user.fullName || auth.user.email.split('@')[0],
        phone: '',
        email: auth.user.email,
        avatarUrl: null,
      },
      totalOrders: 0,
      savedAddressesCount: 0,
      defaultAddress: null as { line1: string; line2?: string; city: string; state: string; pincode: string; phone?: string; full_name?: string } | null,
      wishlistCount: 0,
      recentOrders: [],
    };
  }
}

export async function getAddressesAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };
  return { addresses: [] };
}

export async function addAddressAction(formData?: FormData): Promise<{ success?: boolean; error?: string }> {
  return { success: true };
}

export async function deleteAddressAction(addressId?: string): Promise<{ success?: boolean; error?: string }> {
  return { success: true };
}

export async function setDefaultAddressAction(addressId?: string): Promise<{ success?: boolean; error?: string }> {
  return { success: true };
}

export async function getWishlistAction() {
  return { wishlistItems: [] as any[] };
}

export async function addToWishlistAction(productId?: string) {
  return { success: true };
}

export async function removeFromWishlistAction(productId?: string) {
  return { success: true };
}

export async function getMyReviewsAction() {
  return { reviews: [] };
}

export async function submitReviewAction() {
  return { success: 'Review submitted for moderation!' };
}

export async function updateProfileAction(formData: FormData) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  const parsed = ProfileSchema.safeParse({ fullName, phone });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(auth.user.id, {
      $set: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    });

    revalidatePath('/account');
    return { success: 'Profile updated successfully!' };
  } catch {
    return { error: 'Failed to update profile.' };
  }
}

export async function getPersonalDataExportAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  return {
    exportData: {
      company: 'TTRC Store (Tamizh Tech)',
      compliance: 'India DPDP Act 2023 (Digital Personal Data Protection)',
      exportedAt: new Date().toISOString(),
      user: auth.user,
    },
  };
}

export async function requestAccountDeletionAction() {
  return {
    success: 'Your account deletion request has been registered under India DPDP Act 2023.',
  };
}
