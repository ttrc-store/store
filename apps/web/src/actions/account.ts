'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

const AddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid 10-digit phone number is required'),
  line1: z.string().min(5, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, '6-digit Indian Pincode is required'),
  isDefault: z.boolean().default(false),
  label: z.string().optional(),
});

const ReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().min(1).max(5),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(10, 'Review text must be at least 10 characters'),
});

const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid 10-digit phone number is required'),
});

// ─── 1. Account Overview ──────────────────────────────────────────────────────

export async function getAccountOverviewAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const userId = auth.user.id;

  try {
    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('id', userId)
      .single();

    // 2. Fetch Total Orders Count
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 3. Fetch Saved Addresses Count
    const { count: savedAddressesCount } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 4. Fetch Default or Primary Address
    const { data: defaultAddress } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Fetch Wishlist Items Count
    const { count: wishlistCount } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 6. Fetch Recent Orders (Top 3 for Logged-In User ONLY)
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select('id, order_number, status, total_paise, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Populate order item snapshot names for recent orders
    const recentOrders = await Promise.all(
      (recentOrdersData ?? []).map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('snapshot_name, quantity')
          .eq('order_id', order.id);

        const itemCount = (items ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
        const name = items && items[0] ? items[0].snapshot_name : 'Robotics Order';

        return {
          id: order.id,
          orderNumber: order.order_number ?? `TTRC/#${order.id.slice(0, 8)}`,
          date: new Date(order.created_at).toISOString().split('T')[0],
          status: order.status,
          totalPaise: order.total_paise,
          itemCount,
          name,
        };
      })
    );

    return {
      profile: {
        fullName: profile?.full_name ?? auth.user.email.split('@')[0],
        phone: profile?.phone ?? '',
        email: auth.user.email,
        avatarUrl: profile?.avatar_url ?? null,
      },
      totalOrders: totalOrders ?? 0,
      savedAddressesCount: savedAddressesCount ?? 0,
      defaultAddress: defaultAddress ?? null,
      wishlistCount: wishlistCount ?? 0,
      recentOrders,
    };
  } catch (err) {
    console.error('[getAccountOverviewAction] Error:', err);
    return {
      profile: {
        fullName: auth.user.email.split('@')[0],
        phone: '',
        email: auth.user.email,
        avatarUrl: null,
      },
      totalOrders: 0,
      savedAddressesCount: 0,
      defaultAddress: null,
      wishlistCount: 0,
      recentOrders: [],
    };
  }
}

// ─── 2. Address Book Actions ─────────────────────────────────────────────────

export async function getAddressesAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return { error: 'Failed to load addresses.' };
  return { addresses: data ?? [] };
}

export async function addAddressAction(formData: FormData) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const raw = {
    fullName: formData.get('fullName') as string,
    phone: formData.get('phone') as string,
    line1: formData.get('line1') as string,
    line2: (formData.get('line2') as string) || undefined,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    pincode: formData.get('pincode') as string,
    isDefault: formData.get('isDefault') === 'true',
    label: (formData.get('label') as string) || 'Home',
  };

  const parsed = AddressSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const userId = auth.user.id;

  if (parsed.data.isDefault) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { error } = await supabase.from('addresses').insert({
    user_id: userId,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? null,
    city: parsed.data.city,
    state: parsed.data.state,
    pincode: parsed.data.pincode,
    is_default: parsed.data.isDefault,
    label: parsed.data.label,
  });

  if (error) return { error: 'Failed to save address.' };

  revalidatePath('/account/addresses');
  revalidatePath('/account');
  return { success: true };
}

export async function deleteAddressAction(addressId: string) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', auth.user.id);

  if (error) return { error: 'Failed to delete address.' };

  revalidatePath('/account/addresses');
  revalidatePath('/account');
  return { success: true };
}

export async function setDefaultAddressAction(addressId: string) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const userId = auth.user.id;

  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId);

  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) return { error: 'Failed to update default address.' };

  revalidatePath('/account/addresses');
  revalidatePath('/account');
  return { success: true };
}

// ─── 3. Wishlist Actions ─────────────────────────────────────────────────────

export async function getWishlistAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      id, product_id, created_at,
      products (
        id, name, slug, price_paise, mrp_paise, stock_qty, type, brand,
        product_images (url, sort_order)
      )
    `)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getWishlistAction] Error:', error);
    return { wishlistItems: [] };
  }

  const wishlistItems = (data ?? []).map((w: any) => {
    const p = w.products;
    const images = (p?.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    return {
      wishlistId: w.id,
      productId: p?.id,
      name: p?.name ?? 'Robotics Product',
      slug: p?.slug ?? '',
      pricePaise: p?.price_paise ?? 0,
      mrpPaise: p?.mrp_paise ?? null,
      stockQty: p?.stock_qty ?? 0,
      type: p?.type ?? 'general',
      imageUrl: images[0]?.url || '/brand/ttrc-logo.png',
    };
  });

  return { wishlistItems };
}

export async function addToWishlistAction(productId: string) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase.from('wishlists').upsert({
    user_id: auth.user.id,
    product_id: productId,
  });

  if (error) return { error: 'Failed to add item to wishlist.' };

  revalidatePath('/account/wishlist');
  revalidatePath('/account');
  return { success: true };
}

export async function removeFromWishlistAction(productId: string) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('product_id', productId);

  if (error) return { error: 'Failed to remove item from wishlist.' };

  revalidatePath('/account/wishlist');
  revalidatePath('/account');
  return { success: true };
}

// ─── 4. Product Reviews Actions ───────────────────────────────────────────────

export async function getMyReviewsAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, title, body, is_verified, is_approved, created_at,
      products (name, slug)
    `)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) return { reviews: [] };

  const reviews = (data ?? []).map((r: any) => ({
    id: r.id,
    productName: r.products?.name ?? 'Robotics Kit',
    productSlug: r.products?.slug ?? '',
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    title: r.title,
    body: r.body,
    isVerified: r.is_verified,
    status: r.is_approved ? 'Approved' : 'Pending Moderation',
  }));

  return { reviews };
}

export async function submitReviewAction(formData: FormData) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const raw = {
    productId: formData.get('productId') as string,
    rating: Number(formData.get('rating')),
    title: formData.get('title') as string,
    body: formData.get('body') as string,
  };

  const parsed = ReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();

  // Check if user has purchased this product in a delivered order
  const { data: deliveredItem } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id, status)')
    .eq('product_id', parsed.data.productId)
    .eq('orders.user_id', auth.user.id)
    .eq('orders.status', 'delivered')
    .limit(1)
    .maybeSingle();

  const isVerified = Boolean(deliveredItem);

  const { error } = await supabase.from('reviews').upsert({
    user_id: auth.user.id,
    product_id: parsed.data.productId,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    is_verified: isVerified,
    is_approved: false, // requires admin moderation
  });

  if (error) return { error: 'Failed to submit review. You may have already reviewed this product.' };

  revalidatePath('/account/reviews');
  return { success: 'Review submitted for moderation!' };
}

// ─── 5. Profile Update ────────────────────────────────────────────────────────

export async function updateProfileAction(formData: FormData) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  const parsed = ProfileSchema.safeParse({ fullName, phone });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').upsert({
    id: auth.user.id,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: 'Failed to update profile.' };

  revalidatePath('/account');
  return { success: 'Profile updated successfully!' };
}

// ─── 6. DPDP Data Export & Account Deletion ───────────────────────────────────

export async function getPersonalDataExportAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const userId = auth.user.id;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId);
  const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId);
  const { data: wishlists } = await supabase.from('wishlists').select('*, products(name, sku)').eq('user_id', userId);
  const { data: reviews } = await supabase.from('reviews').select('*, products(name)').eq('user_id', userId);

  return {
    exportData: {
      company: 'TTRC Store (Tamizh Tech)',
      compliance: 'India DPDP Act 2023 (Digital Personal Data Protection)',
      exportedAt: new Date().toISOString(),
      user: {
        id: userId,
        email: auth.user.email,
        role: auth.user.role,
        profile: profile ?? null,
      },
      addresses: addresses ?? [],
      orders: orders ?? [],
      wishlists: wishlists ?? [],
      reviews: reviews ?? [],
    },
  };
}

export async function requestAccountDeletionAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'account_deletion_requested',
    table_name: 'profiles',
    record_id: auth.user.id,
    new_data: { status: 'deletion_requested', requested_at: new Date().toISOString() },
  });

  return {
    success: 'Your account deletion request has been registered under India DPDP Act 2023. Statutory tax records will be anonymized.',
  };
}
