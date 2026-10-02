'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { ProductModel, OrderModel, UserModel, CouponModel } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProductSchema, sanitizeVideoEmbedUrl } from '@/lib/video-utils';
import { revalidatePath } from 'next/cache';

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export async function createProductAction(input: z.infer<typeof ProductSchema>) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const validation = ProductSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const data = validation.data;
  const sanitizedVideo = sanitizeVideoEmbedUrl(data.videoUrl);

  try {
    await connectToDatabase();

    const existingProduct = await ProductModel.findOne({
      $or: [{ slug: data.slug }, { sku: data.sku }],
    });

    if (existingProduct) {
      return { error: 'A product with this slug or SKU already exists. Please use a unique value.' };
    }

    const images = [...(data.imageUrls || [])];
    if (sanitizedVideo) {
      images.push(sanitizedVideo);
    }

    const product = await ProductModel.create({
      name: data.name,
      slug: data.slug,
      sku: data.sku || `TTRC-PRD-${Date.now().toString().slice(-4)}`,
      product_type: data.productType === 'general' ? 'standard' : data.productType,
      category_id: data.categoryId || undefined,
      short_description: data.shortDescription || data.name,
      description: data.longDescription || data.shortDescription || data.name,
      price: data.pricePaise,
      compare_at_price: data.mrpPaise || undefined,
      gst_percent: data.gstPercent,
      hsn_code: data.hsnCode || '8542',
      stock_quantity: data.stockQty,
      weight_grams: data.weightGrams || 100,
      country_of_origin: data.countryOfOrigin || 'India',
      images,
      meta_title: data.seoTitle || undefined,
      meta_description: data.seoDescription || undefined,
    });

    revalidatePath('/admin/products');
    revalidatePath(`/product/${product.slug}`);

    return { success: true, productId: product._id.toString(), slug: product.slug };
  } catch (err: any) {
    console.error('[Admin] createProduct error:', err);
    return { error: err.message || 'Failed to create product. Please try again.' };
  }
}

export async function updateProductAction(
  id: string,
  input: z.infer<typeof ProductSchema>
) {
  if (!id) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const validation = ProductSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const data = validation.data;
  const sanitizedVideo = sanitizeVideoEmbedUrl(data.videoUrl);

  try {
    await connectToDatabase();

    const images = [...(data.imageUrls || [])];
    if (sanitizedVideo) {
      images.push(sanitizedVideo);
    }

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          product_type: data.productType === 'general' ? 'standard' : data.productType,
          category_id: data.categoryId || undefined,
          short_description: data.shortDescription || data.name,
          description: data.longDescription || data.shortDescription || data.name,
          price: data.pricePaise,
          compare_at_price: data.mrpPaise || undefined,
          gst_percent: data.gstPercent,
          hsn_code: data.hsnCode || '8542',
          stock_quantity: data.stockQty,
          weight_grams: data.weightGrams || 100,
          country_of_origin: data.countryOfOrigin || 'India',
          images,
          meta_title: data.seoTitle || undefined,
          meta_description: data.seoDescription || undefined,
        },
      },
      { new: true }
    );

    if (!updated) {
      return { error: 'Product not found.' };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/product/${data.slug}`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update product.' };
  }
}

export async function archiveProductAction(id: string) {
  if (!id) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await ProductModel.findByIdAndUpdate(id, { $set: { is_active: false } });
    revalidatePath('/admin/products');
    return { success: true };
  } catch {
    return { error: 'Failed to archive product.' };
  }
}

export async function deleteProductAction(id: string) {
  if (!id) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await ProductModel.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    return { success: true };
  } catch {
    return { error: 'Failed to delete product.' };
  }
}

// ─── Order Management ─────────────────────────────────────────────────────────

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string,
  trackingNumber?: string,
  adminNote?: string
) {
  if (!orderId) return { error: 'Order ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const order = await OrderModel.findById(orderId);
    if (!order) return { error: 'Order not found.' };

    order.status = newStatus as any;
    if (trackingNumber) {
      order.tracking_number = trackingNumber;
    }
    await order.save();

    revalidatePath('/admin/orders');
    revalidatePath(`/orders/${orderId}`);

    return {
      success: true,
      orderNumber: order.order_number,
      newStatus,
    };
  } catch {
    return { error: 'Failed to update order status.' };
  }
}

export async function disableCustomerAction(userId: string) {
  if (!userId) return { error: 'User ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(userId, { $set: { role: 'customer' } });
    return { success: true, message: 'Customer account updated.' };
  } catch {
    return { error: 'Failed to disable customer.' };
  }
}

export async function adjustInventoryAction(
  productId: string,
  delta: number
) {
  if (!productId) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const product = await ProductModel.findById(productId);
    if (!product) return { error: 'Product not found.' };

    const newQty = product.stock_quantity + delta;
    if (newQty < 0) {
      return { error: `Cannot set stock below 0. Current: ${product.stock_quantity}, delta: ${delta}.` };
    }

    product.stock_quantity = newQty;
    await product.save();

    revalidatePath('/admin/products');
    return { success: true, newQty };
  } catch {
    return { error: 'Failed to adjust inventory.' };
  }
}

const CouponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, 'Coupon code must be uppercase alphanumeric'),
  type: z.enum(['percent', 'flat']),
  value: z.number().int().min(1),
  min_order_paise: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export async function createCouponAction(input: z.infer<typeof CouponSchema>) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const validation = CouponSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    await connectToDatabase();
    const coupon = await CouponModel.create({
      code: validation.data.code.toUpperCase(),
      discount_type: validation.data.type === 'percent' ? 'percentage' : 'fixed',
      discount_value: validation.data.value,
      min_order_value_paise: validation.data.min_order_paise,
      is_active: validation.data.is_active,
    });

    revalidatePath('/admin/coupons');
    return { success: true, couponId: coupon._id.toString() };
  } catch {
    return { error: 'Failed to create coupon or coupon already exists.' };
  }
}
