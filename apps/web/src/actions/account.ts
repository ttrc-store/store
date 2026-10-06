'use server';

import { connectToDatabase } from '@/lib/mongodb/client';
import {
  UserModel,
  OrderModel,
  ProductModel,
  ReviewModel,
  AuditLogModel,
  IUserAddress,
} from '@/lib/mongodb/models';
import { requireAuth } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid 10-digit phone number is required'),
});

const AddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid phone number is required'),
  line1: z.string().min(3, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  isDefault: z.boolean().optional(),
});

// ─── 1. ACCOUNT OVERVIEW ─────────────────────────────────────────────────────

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

    const addresses = ((user?.addresses as IUserAddress[]) || []);
    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0] || null;
    const wishlistItems = (user?.wishlist as string[]) || [];

    return {
      profile: {
        fullName: user?.full_name || auth.user.fullName || auth.user.email.split('@')[0],
        phone: user?.phone || '',
        email: auth.user.email,
        avatarUrl: user?.avatar_url || null,
        customerId: user?.customer_id || 'TTRC-CUS-00001',
      },
      totalOrders,
      savedAddressesCount: addresses.length,
      defaultAddress: defaultAddr
        ? {
            line1: defaultAddr.line1,
            line2: defaultAddr.line2,
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode,
            phone: defaultAddr.phone,
            full_name: defaultAddr.fullName,
          }
        : null,
      wishlistCount: wishlistItems.length,
      recentOrders: recentOrders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.order_number,
        date: order.created_at.toISOString().split('T')[0],
        status: order.status,
        totalPaise: order.total,
        itemCount: (order.items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0),
        name: order.items?.[0]?.product_name || 'Robotics Component',
      })),
    };
  } catch (err: any) {
    console.error('[Account Overview Error]', err);
    return {
      profile: {
        fullName: auth.user.fullName || auth.user.email.split('@')[0],
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

// ─── 2. ADDRESS BOOK (CRUD) ──────────────────────────────────────────────────

export async function getAddressesAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const user = await UserModel.findById(auth.user.id).lean();
    return { addresses: (user?.addresses as IUserAddress[]) || [] };
  } catch {
    return { addresses: [] };
  }
}

export async function addAddressAction(formData?: FormData): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };
  if (!formData) return { error: 'Address data missing.' };

  const raw = {
    fullName: formData.get('fullName') as string,
    phone: formData.get('phone') as string,
    line1: formData.get('line1') as string,
    line2: (formData.get('line2') as string) || '',
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    pincode: formData.get('pincode') as string,
    isDefault: formData.get('isDefault') === 'true' || formData.get('isDefault') === 'on',
  };

  const parsed = AddressSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await connectToDatabase();
    const user = await UserModel.findById(auth.user.id);
    if (!user) return { error: 'User account not found.' };

    const currentAddresses: IUserAddress[] = (user.addresses as IUserAddress[]) || [];
    const isFirst = currentAddresses.length === 0;
    const shouldBeDefault = parsed.data.isDefault || isFirst;

    // If making this default, reset other addresses
    if (shouldBeDefault) {
      currentAddresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    const newAddress: IUserAddress = {
      id: `addr_${Date.now()}`,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      isDefault: shouldBeDefault,
    };

    currentAddresses.push(newAddress);
    user.addresses = currentAddresses;
    user.markModified('addresses');
    await user.save();

    revalidatePath('/account');
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (err: any) {
    console.error('[Add Address Error]', err);
    return { error: 'Failed to save address.' };
  }
}

export async function deleteAddressAction(addressId?: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };
  if (!addressId) return { error: 'Address ID is required.' };

  try {
    await connectToDatabase();
    const user = await UserModel.findById(auth.user.id);
    if (!user) return { error: 'User account not found.' };

    let currentAddresses: IUserAddress[] = (user.addresses as IUserAddress[]) || [];
    currentAddresses = currentAddresses.filter((a) => a.id !== addressId);

    // If we deleted default, promote first remaining
    if (currentAddresses.length > 0 && !currentAddresses.some((a) => a.isDefault)) {
      currentAddresses[0].isDefault = true;
    }

    user.addresses = currentAddresses;
    user.markModified('addresses');
    await user.save();

    revalidatePath('/account');
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (err: any) {
    console.error('[Delete Address Error]', err);
    return { error: 'Failed to delete address.' };
  }
}

export async function setDefaultAddressAction(addressId?: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };
  if (!addressId) return { error: 'Address ID is required.' };

  try {
    await connectToDatabase();
    const user = await UserModel.findById(auth.user.id);
    if (!user) return { error: 'User account not found.' };

    const currentAddresses: IUserAddress[] = (user.addresses as IUserAddress[]) || [];
    currentAddresses.forEach((a) => {
      a.isDefault = a.id === addressId;
    });

    user.addresses = currentAddresses;
    user.markModified('addresses');
    await user.save();

    revalidatePath('/account');
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (err: any) {
    console.error('[Set Default Address Error]', err);
    return { error: 'Failed to update default address.' };
  }
}

// ─── 3. WISHLIST ─────────────────────────────────────────────────────────────

export async function getWishlistAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const user = await UserModel.findById(auth.user.id).lean();
    const wishlistIds = (user?.wishlist as string[]) || [];

    if (wishlistIds.length === 0) {
      return { wishlistItems: [] };
    }

    const products = await ProductModel.find({
      _id: { $in: wishlistIds },
      is_active: true,
    }).lean();

    const wishlistItems = products.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      slug: p.slug,
      pricePaise: p.price,
      mrpPaise: p.compare_at_price,
      imageUrl: p.images?.[0] || '/brand/ttrc-logo.png',
      stockQty: p.stock_quantity,
      type: p.product_type || 'standard',
    }));

    return { wishlistItems };
  } catch (err: any) {
    console.error('[Get Wishlist Error]', err);
    return { wishlistItems: [] };
  }
}

export async function addToWishlistAction(productId?: string) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };
  if (!productId) return { error: 'Product ID required.' };

  try {
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(auth.user.id, {
      $addToSet: { wishlist: productId },
    });

    revalidatePath('/account');
    revalidatePath('/account/wishlist');
    return { success: true };
  } catch (err: any) {
    console.error('[Add Wishlist Error]', err);
    return { error: 'Failed to save to wishlist.' };
  }
}

export async function removeFromWishlistAction(productId?: string) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };
  if (!productId) return { error: 'Product ID required.' };

  try {
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(auth.user.id, {
      $pull: { wishlist: productId },
    });

    revalidatePath('/account');
    revalidatePath('/account/wishlist');
    return { success: true };
  } catch (err: any) {
    console.error('[Remove Wishlist Error]', err);
    return { error: 'Failed to remove from wishlist.' };
  }
}

// ─── 4. REVIEWS ──────────────────────────────────────────────────────────────

export async function getMyReviewsAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const reviews = await ReviewModel.find({ user_id: auth.user.id })
      .sort({ created_at: -1 })
      .lean();

    if (reviews.length === 0) {
      return { reviews: [] };
    }

    const productIds = reviews.map((r) => r.product_id);
    const products = await ProductModel.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const formattedReviews = reviews.map((r) => {
      const prod = productMap.get(r.product_id);
      return {
        id: r._id.toString(),
        productName: prod?.name || 'Robotics Component',
        productSlug: prod?.slug || '',
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        status: r.status === 'approved' ? 'Verified Review' : 'Under Review',
        title: r.title || 'Product Feedback',
        body: r.comment,
      };
    });

    return { reviews: formattedReviews };
  } catch (err: any) {
    console.error('[Get My Reviews Error]', err);
    return { reviews: [] };
  }
}

export async function submitReviewAction(input: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const { productId, rating, title, comment } = input;
  if (!productId || !comment || !rating || rating < 1 || rating > 5) {
    return { error: 'Valid rating (1-5) and review comment are required.' };
  }

  try {
    await connectToDatabase();

    // Check if user has an order containing this product to verify purchase
    const orderWithProduct = await OrderModel.findOne({
      user_id: auth.user.id,
      'items.product_id': productId,
      status: { $in: ['shipped', 'delivered'] },
    }).lean();

    const isVerified = !!orderWithProduct;

    await ReviewModel.create({
      product_id: productId,
      user_id: auth.user.id,
      user_name: auth.user.fullName || auth.user.email.split('@')[0],
      rating,
      title: title || 'Customer Review',
      comment,
      images: [],
      is_verified_purchase: isVerified,
      status: 'approved',
    });

    revalidatePath('/account/reviews');
    revalidatePath(`/product/${productId}`);
    return { success: 'Review submitted successfully!' };
  } catch (err: any) {
    console.error('[Submit Review Error]', err);
    return { error: 'Failed to submit review.' };
  }
}

// ─── 5. PROFILE & DPDP PRIVACY ACTIONS ───────────────────────────────────────

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

  try {
    await connectToDatabase();
    const userId = auth.user.id;

    const [user, orders, reviews] = await Promise.all([
      UserModel.findById(userId).lean(),
      OrderModel.find({ user_id: userId }).lean(),
      ReviewModel.find({ user_id: userId }).lean(),
    ]);

    // Strip private hashes or internal admin keys
    const sanitizedUser = user ? {
      customerId: user.customer_id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      joinedAt: user.created_at,
      addresses: user.addresses || [],
      wishlist: user.wishlist || [],
    } : null;

    const sanitizedOrders = orders.map((o) => ({
      orderNumber: o.order_number,
      createdAt: o.created_at,
      status: o.status,
      paymentMethod: o.payment_method,
      totalPaise: o.total,
      shippingAddress: o.shipping_address,
      items: (o.items || []).map((i: any) => ({
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
      })),
    }));

    return {
      exportData: {
        company: 'TTRC Store (Tamizh Tech)',
        compliance: 'India DPDP Act 2023 (Digital Personal Data Protection)',
        exportedAt: new Date().toISOString(),
        customerProfile: sanitizedUser,
        orderHistory: sanitizedOrders,
        reviewsSubmitted: reviews.map((r) => ({
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          createdAt: r.created_at,
        })),
      },
    };
  } catch (err: any) {
    console.error('[DPDP Export Error]', err);
    return { error: 'Failed to compile personal data export.' };
  }
}

export async function requestAccountDeletionAction() {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    // Log authoritative audit trail under India DPDP Act 2023
    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'DPDP_ACCOUNT_DELETION_REQUESTED',
      entity: 'User',
      entity_id: auth.user.id,
      metadata: { email: auth.user.email, requestedAt: new Date().toISOString() },
    });

    // Clear personal marketing data while keeping statutory tax invoice/financial data intact
    await UserModel.findByIdAndUpdate(auth.user.id, {
      $set: {
        full_name: 'Anonymized User',
        phone: undefined,
        addresses: [],
        wishlist: [],
      },
    });

    revalidatePath('/account');
    return {
      success:
        'Your personal profile data has been anonymized. Historical statutory tax invoices required for Indian GST compliance are securely archived per statutory regulations.',
    };
  } catch (err: any) {
    console.error('[Account Deletion Request Error]', err);
    return { error: 'Failed to process account deletion request.' };
  }
}
