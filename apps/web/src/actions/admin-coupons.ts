'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb/client';
import { CouponModel, ICoupon } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export interface AdminCouponSummary {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValuePaise: number;
  maxDiscountPaise?: number;
  usageCount: number;
  usageLimit?: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

const CreateCouponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(30).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be greater than zero'),
  minOrderPaise: z.number().nonnegative().default(0).optional(),
  maxDiscountPaise: z.number().positive().optional(),
  usageLimit: z.number().positive().optional(),
  perUserLimit: z.number().positive().default(1).optional(),
  expiresAt: z.string().optional(),
});

export async function getAdminCouponsAction() {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const coupons = await CouponModel.find().sort({ created_at: -1 }).lean();

    const formatted: AdminCouponSummary[] = coupons.map((c: any) => ({
      id: c._id.toString(),
      code: c.code,
      discountType: c.discount_type,
      discountValue: c.discount_value,
      minOrderValuePaise: c.min_order_value_paise || 0,
      maxDiscountPaise: c.max_discount_paise,
      usageCount: c.usage_count || 0,
      usageLimit: c.usage_limit,
      isActive: c.is_active,
      expiresAt: c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : undefined,
      createdAt: new Date(c.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    return { coupons: formatted };
  } catch (err: any) {
    console.error('[Get Admin Coupons Error]', err);
    return { error: 'Failed to load coupon directory.' };
  }
}

export async function createAdminCouponAction(raw: z.infer<typeof CreateCouponSchema>) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = CreateCouponSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const {
    code,
    discountType,
    discountValue,
    minOrderPaise,
    maxDiscountPaise,
    usageLimit,
    perUserLimit,
    expiresAt,
  } = parsed.data;

  try {
    await connectToDatabase();

    const existing = await CouponModel.findOne({ code });
    if (existing) {
      return { error: `Coupon code "${code}" already exists.` };
    }

    await (CouponModel as any).create({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_value_paise: minOrderPaise,
      max_discount_paise: maxDiscountPaise,
      usage_limit: usageLimit,
      per_user_limit: perUserLimit,
      usage_count: 0,
      is_active: true,
      expires_at: expiresAt ? new Date(expiresAt) : undefined,
    });

    revalidatePath('/admin/coupons');
    return { success: true, message: `Coupon "${code}" created successfully.` };
  } catch (err: any) {
    console.error('[Create Coupon Error]', err);
    return { error: 'Failed to create coupon.' };
  }
}

export async function toggleCouponStatusAction(couponId: string, isActive: boolean) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await CouponModel.findByIdAndUpdate(couponId, { $set: { is_active: isActive } });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (err: any) {
    return { error: 'Failed to toggle coupon status.' };
  }
}

export async function deleteAdminCouponAction(couponId: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await CouponModel.findByIdAndDelete(couponId);
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (err: any) {
    return { error: 'Failed to delete coupon.' };
  }
}
