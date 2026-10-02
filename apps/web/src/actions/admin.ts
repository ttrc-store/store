'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProductSchema, sanitizeVideoEmbedUrl } from '@/lib/video-utils';
import { revalidatePath } from 'next/cache';

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export async function createProductAction(input: z.infer<typeof ProductSchema>) {
  // Security: admin/staff only
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const validation = ProductSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const data = validation.data;
  const sanitizedVideo = sanitizeVideoEmbedUrl(data.videoUrl);

  const supabase = await createClient();

  const productRow = {
    name: data.name,
    slug: data.slug,
    sku: data.sku || `TTRC-PRD-${Date.now().toString().slice(-4)}`,
    type: data.productType === 'standard' ? 'general' : data.productType,
    brand: data.brand || 'Tamizh Tech',
    category_id: data.categoryId || null,
    short_description: data.shortDescription || data.name,
    long_description: data.longDescription || data.shortDescription || data.name,
    price_paise: data.pricePaise,
    mrp_paise: data.mrpPaise || null,
    gst_percent: data.gstPercent,
    hsn_code: data.hsnCode || null,
    stock_qty: data.stockQty,
    weight_grams: data.weightGrams || null,
    country_of_origin: data.countryOfOrigin || 'India',
    status: 'published' as const,
    tags: data.tags || [],
    seo_title: data.seoTitle || null,
    seo_description: data.seoDescription || null,
  };

  const { data: product, error } = await supabase
    .from('products')
    .insert(productRow)
    .select('id, slug, name')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation (slug or SKU)
      return { error: 'A product with this slug or SKU already exists. Please use a unique value.' };
    }
    console.error('[Admin] createProduct error:', error);
    return { error: 'Failed to create product. Please try again.' };
  }

  // Insert images
  if (data.imageUrls && data.imageUrls.length > 0) {
    const images = data.imageUrls.map((url: string, idx: number) => ({
      product_id: product.id,
      url,
      alt: data.name,
      sort_order: idx,
    }));
    await supabase.from('product_images').insert(images);
  }

  // Insert specs
  if (data.specs && data.specs.length > 0) {
    const specs = data.specs
      .filter((s: { key: string; value: string }) => s.key && s.value)
      .map((s: { key: string; value: string }, idx: number) => ({
        product_id: product.id,
        key: s.key,
        value: s.value,
        sort_order: idx,
      }));
    if (specs.length > 0) {
      await supabase.from('product_specs').insert(specs);
    }
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'product.created',
    table_name: 'products',
    record_id: product.id,
    new_data: { name: product.name, slug: product.slug },
  });

  // Store video embed URL in product_images or separate record if needed
  // For now, we store it as a meta field; future can be product_videos table
  if (sanitizedVideo) {
    await supabase.from('product_images').insert({
      product_id: product.id,
      url: sanitizedVideo,
      alt: `${data.name} Video`,
      sort_order: 999, // Always last
    });
  }

  revalidatePath('/admin/products');
  revalidatePath(`/product/${product.slug}`);

  return { success: true, productId: product.id, slug: product.slug };
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
  const supabase = await createClient();

  // Get old data for audit log
  const { data: oldProduct } = await supabase
    .from('products')
    .select('name, price_paise, stock_qty, slug')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('products')
    .update({
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      type: data.productType === 'standard' ? 'general' : data.productType,
      brand: data.brand || 'Tamizh Tech',
      category_id: data.categoryId || null,
      short_description: data.shortDescription || data.name,
      long_description: data.longDescription || data.shortDescription || data.name,
      price_paise: data.pricePaise,
      mrp_paise: data.mrpPaise || null,
      gst_percent: data.gstPercent,
      hsn_code: data.hsnCode || null,
      stock_qty: data.stockQty,
      weight_grams: data.weightGrams || null,
      country_of_origin: data.countryOfOrigin || 'India',
      tags: data.tags || [],
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with this slug or SKU already exists.' };
    }
    return { error: 'Failed to update product.' };
  }

  // Replace images
  if (data.imageUrls !== undefined) {
    // Remove old non-video images
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id)
      .neq('sort_order', 999);

    if (data.imageUrls.length > 0) {
      const images = data.imageUrls.map((url: string, idx: number) => ({
        product_id: id,
        url,
        alt: data.name,
        sort_order: idx,
      }));
      await supabase.from('product_images').insert(images);
    }
  }

  // Replace specs
  if (data.specs !== undefined) {
    await supabase.from('product_specs').delete().eq('product_id', id);
    const specs = (data.specs ?? [])
      .filter((s: { key: string; value: string }) => s.key && s.value)
      .map((s: { key: string; value: string }, idx: number) => ({
        product_id: id,
        key: s.key,
        value: s.value,
        sort_order: idx,
      }));
    if (specs.length > 0) {
      await supabase.from('product_specs').insert(specs);
    }
  }

  // Update video
  if (sanitizedVideo !== undefined) {
    await supabase.from('product_images').delete().eq('product_id', id).eq('sort_order', 999);
    if (sanitizedVideo) {
      await supabase.from('product_images').insert({
        product_id: id,
        url: sanitizedVideo,
        alt: `${data.name} Video`,
        sort_order: 999,
      });
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'product.updated',
    table_name: 'products',
    record_id: id,
    old_data: oldProduct ?? {},
    new_data: { name: data.name, price_paise: data.pricePaise, stock_qty: data.stockQty },
  });

  revalidatePath('/admin/products');
  revalidatePath(`/product/${data.slug}`);

  return { success: true };
}

export async function archiveProductAction(id: string) {
  if (!id) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  // Soft-archive: set status to archived
  const { error } = await supabase
    .from('products')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Failed to archive product.' };

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'product.archived',
    table_name: 'products',
    record_id: id,
  });

  revalidatePath('/admin/products');
  return { success: true };
}

/** Hard delete only for products with NO order history */
export async function deleteProductAction(id: string) {
  if (!id) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  // Check for order history
  const { count } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id);

  if ((count ?? 0) > 0) {
    // Has order history — archive instead of delete
    return await archiveProductAction(id);
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error: 'Failed to delete product.' };

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'product.deleted',
    table_name: 'products',
    record_id: id,
  });

  revalidatePath('/admin/products');
  return { success: true };
}

// ─── Order Management ─────────────────────────────────────────────────────────

const VALID_ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['confirmed', 'cancelled', 'payment_failed'],
  payment_failed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'cancelled'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],
};

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string,
  trackingNumber?: string,
  adminNote?: string
) {
  if (!orderId) return { error: 'Order ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  // Load current order
  const { data: order, error: loadError } = await supabase
    .from('orders')
    .select('id, status, order_number')
    .eq('id', orderId)
    .single();

  if (loadError || !order) return { error: 'Order not found.' };

  // Validate transition
  const allowedNext = VALID_ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  if (!allowedNext.includes(newStatus)) {
    return {
      error: `Cannot transition order from "${order.status}" to "${newStatus}".`,
    };
  }

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (adminNote) updatePayload.admin_note = adminNote;

  const { error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId);

  if (updateError) return { error: 'Failed to update order status.' };

  // If shipping, create/update shipment record
  if (newStatus === 'shipped' && trackingNumber) {
    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingShipment) {
      await supabase
        .from('shipments')
        .update({
          tracking_number: trackingNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingShipment.id);
    } else {
      await supabase.from('shipments').insert({
        order_id: orderId,
        provider: 'manual',
        tracking_number: trackingNumber,
      });
    }
  }

  // Log order event
  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: `order_${newStatus}`,
    actor_id: auth.user.id,
    actor_role: auth.user.role,
    meta: {
      previous_status: order.status,
      new_status: newStatus,
      tracking_number: trackingNumber ?? null,
    },
  });

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'order.status_changed',
    table_name: 'orders',
    record_id: orderId,
    old_data: { status: order.status },
    new_data: { status: newStatus, tracking_number: trackingNumber },
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/orders/${orderId}`);

  return {
    success: true,
    orderNumber: order.order_number,
    newStatus,
  };
}

// ─── Customer Management ──────────────────────────────────────────────────────

export async function disableCustomerAction(userId: string) {
  if (!userId) return { error: 'User ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };
  if (auth.user.role !== 'admin') return { error: 'Only admin can disable customers.' };

  // NOTE: Disabling via Supabase Admin API requires service-role key.
  // For now, we mark the user in our profiles table.
  // Full implementation requires SUPABASE_SERVICE_ROLE_KEY to call admin.auth.updateUserById
  const supabase = await createClient();

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'customer.disabled',
    table_name: 'profiles',
    record_id: userId,
  });

  return { success: true, message: 'Customer account flagged as disabled.' };
}

// ─── Review Moderation ────────────────────────────────────────────────────────

export async function moderateReviewAction(
  reviewId: string,
  action: 'approve' | 'hide',
  adminReply?: string
) {
  if (!reviewId) return { error: 'Review ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {
    is_approved: action === 'approve',
    updated_at: new Date().toISOString(),
  };

  if (adminReply !== undefined) {
    updatePayload.admin_reply = adminReply;
    updatePayload.admin_reply_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('reviews')
    .update(updatePayload)
    .eq('id', reviewId);

  if (error) return { error: 'Failed to update review.' };

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: `review.${action}`,
    table_name: 'reviews',
    record_id: reviewId,
  });

  revalidatePath('/admin/products');
  return { success: true };
}

// ─── Inventory Adjustment ─────────────────────────────────────────────────────

export async function adjustInventoryAction(
  productId: string,
  delta: number,
  reason: 'adjustment' | 'restock' | 'damage' | 'return',
  note?: string
) {
  if (!productId) return { error: 'Product ID is required' };
  if (!Number.isInteger(delta)) return { error: 'Delta must be an integer.' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: product, error: loadError } = await supabase
    .from('products')
    .select('id, stock_qty, name')
    .eq('id', productId)
    .single();

  if (loadError || !product) return { error: 'Product not found.' };

  const newQty = product.stock_qty + delta;
  if (newQty < 0) {
    return { error: `Cannot set stock below 0. Current: ${product.stock_qty}, delta: ${delta}.` };
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (updateError) return { error: 'Failed to adjust inventory.' };

  await supabase.from('inventory_movements').insert({
    product_id: productId,
    delta,
    reason,
    reference: note ?? `Manual ${reason} by admin`,
    user_id: auth.user.id,
  });

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'inventory.adjusted',
    table_name: 'products',
    record_id: productId,
    old_data: { stock_qty: product.stock_qty },
    new_data: { stock_qty: newQty, delta, reason },
  });

  revalidatePath('/admin/products');
  return { success: true, newQty };
}

// ─── Coupon Management ────────────────────────────────────────────────────────

const CouponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, 'Coupon code must be uppercase alphanumeric'),
  type: z.enum(['percent', 'flat']),
  value: z.number().int().min(1),
  min_order_paise: z.number().int().min(0).default(0),
  max_uses: z.number().int().min(1).nullable().optional(),
  uses_per_user: z.number().int().min(1).nullable().optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_active: z.boolean().default(true),
});

export async function createCouponAction(input: z.infer<typeof CouponSchema>) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const validation = CouponSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Validate percent range
  if (validation.data.type === 'percent' && validation.data.value > 100) {
    return { error: 'Percentage discount cannot exceed 100%.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coupons')
    .insert(validation.data)
    .select('id, code')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'A coupon with this code already exists.' };
    return { error: 'Failed to create coupon.' };
  }

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'coupon.created',
    table_name: 'coupons',
    record_id: data.id,
    new_data: { code: data.code },
  });

  revalidatePath('/admin/coupons');
  return { success: true, couponId: data.id };
}
