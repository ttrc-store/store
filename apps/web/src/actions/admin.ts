'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { ProductModel, OrderModel, UserModel, CouponModel, AuditLogModel } from '@/lib/mongodb/models';
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
      unit: data.unit || 'Piece',
      status: data.status || 'published',
      category_id: data.categoryId || undefined,
      manufacturer_id: data.manufacturerId || undefined,
      brand: data.brand || 'Tamizh Tech',
      supplier: data.supplier || undefined,
      show_manufacturer_publicly: data.showManufacturerPublicly ?? true,
      show_supplier_publicly: data.showSupplierPublicly ?? false,
      short_description: data.shortDescription || data.name,
      description: data.longDescription || data.shortDescription || data.name,
      price: data.pricePaise,
      compare_at_price: data.mrpPaise || undefined,
      cost_price: data.costPricePaise || undefined,
      landed_cost: data.landedCostPaise || undefined,
      internal_notes: data.internalNotes || undefined,
      gst_percent: data.gstPercent,
      hsn_code: data.hsnCode || '8542',
      stock_quantity: data.stockQty,
      weight_grams: data.weightGrams || 100,
      country_of_origin: data.countryOfOrigin || 'India',
      model_number: data.modelNumber,
      part_number: data.partNumber,
      voltage: data.voltage,
      current: data.current,
      dimensions: data.dimensions,
      material: data.material,
      warranty: data.warranty,
      bulk_price_tiers: data.bulkPriceTiers || [],
      technical_specs: data.specs || [],
      applications: data.applications || [],
      certifications: data.certifications || [],
      images,
      media: data.media || [],
      meta_title: data.seoTitle || undefined,
      meta_description: data.seoDescription || undefined,
      is_active: data.status !== 'archived',
    });

    // Record administrative audit log
    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'product.created',
      entity: 'product',
      entity_id: product._id.toString(),
      metadata: {
        name: product.name,
        sku: product.sku,
        pricePaise: product.price,
        status: product.status,
      },
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

    const existing = await ProductModel.findById(id).lean();
    if (!existing) {
      return { error: 'Product not found.' };
    }

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
          unit: data.unit || 'Piece',
          status: data.status || 'published',
          category_id: data.categoryId || undefined,
          manufacturer_id: data.manufacturerId || undefined,
          brand: data.brand || 'Tamizh Tech',
          supplier: data.supplier || undefined,
          show_manufacturer_publicly: data.showManufacturerPublicly ?? true,
          show_supplier_publicly: data.showSupplierPublicly ?? false,
          short_description: data.shortDescription || data.name,
          description: data.longDescription || data.shortDescription || data.name,
          price: data.pricePaise,
          compare_at_price: data.mrpPaise || undefined,
          cost_price: data.costPricePaise || undefined,
          landed_cost: data.landedCostPaise || undefined,
          internal_notes: data.internalNotes || undefined,
          gst_percent: data.gstPercent,
          hsn_code: data.hsnCode || '8542',
          stock_quantity: data.stockQty,
          weight_grams: data.weightGrams || 100,
          country_of_origin: data.countryOfOrigin || 'India',
          model_number: data.modelNumber,
          part_number: data.partNumber,
          voltage: data.voltage,
          current: data.current,
          dimensions: data.dimensions,
          material: data.material,
          warranty: data.warranty,
          bulk_price_tiers: data.bulkPriceTiers || [],
          technical_specs: data.specs || [],
          applications: data.applications || [],
          certifications: data.certifications || [],
          images,
          media: data.media || [],
          meta_title: data.seoTitle || undefined,
          meta_description: data.seoDescription || undefined,
          is_active: data.status !== 'archived',
        },
      },
      { new: true }
    );

    if (!updated) {
      return { error: 'Product not found.' };
    }

    // Record administrative audit log
    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'product.updated',
      entity: 'product',
      entity_id: id,
      metadata: {
        name: data.name,
        priceChanged: existing.price !== data.pricePaise,
        oldPricePaise: existing.price,
        newPricePaise: data.pricePaise,
        status: data.status,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath(`/product/${data.slug}`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update product.' };
  }
}

export async function getAdminProductByIdAction(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const doc = await ProductModel.findById(id).lean();
    if (!doc) return { error: 'Product not found' };

    return {
      product: {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        sku: doc.sku,
        productType: doc.product_type,
        unit: doc.unit || 'Piece',
        status: doc.status || 'published',
        categoryId: doc.category_id,
        manufacturerId: doc.manufacturer_id,
        brand: doc.brand || 'Tamizh Tech',
        supplier: doc.supplier,
        showManufacturerPublicly: doc.show_manufacturer_publicly ?? true,
        showSupplierPublicly: doc.show_supplier_publicly ?? false,
        shortDescription: doc.short_description,
        longDescription: doc.description,
        pricePaise: doc.price,
        mrpPaise: doc.compare_at_price,
        costPricePaise: doc.cost_price,
        landedCostPaise: doc.landed_cost,
        internalNotes: doc.internal_notes,
        gstPercent: doc.gst_percent,
        hsnCode: doc.hsn_code,
        stockQty: doc.stock_quantity,
        weightGrams: doc.weight_grams,
        countryOfOrigin: doc.country_of_origin,
        imageUrls: doc.images || [],
        media: doc.media || [],
        bulkPriceTiers: doc.bulk_price_tiers || [],
        specs: doc.technical_specs || [],
        applications: doc.applications || [],
        certifications: doc.certifications || [],
        modelNumber: doc.model_number,
        partNumber: doc.part_number,
        voltage: doc.voltage,
        current: doc.current,
        material: doc.material,
        dimensions: doc.dimensions,
        warranty: doc.warranty,
      },
    };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch product' };
  }
}

export async function archiveProductAction(id: string) {
  if (!id) return { error: 'Product ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: { is_active: false, status: 'archived' } },
      { new: true }
    );

    if (updated) {
      await AuditLogModel.create({
        actor_id: auth.user.id,
        action: 'product.archived',
        entity: 'product',
        entity_id: id,
        metadata: { name: updated.name, sku: updated.sku },
      });
    }

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

    // Dependency check: prevent destruction if historical orders exist
    const orderCount = await OrderModel.countDocuments({ 'items.product_id': id });
    if (orderCount > 0) {
      return {
        error: `This product has ${orderCount} historical order reference(s) and cannot be deleted. Please Archive the product instead to preserve order integrity.`,
        canArchive: true,
      };
    }

    const deleted = await ProductModel.findByIdAndDelete(id);

    if (deleted) {
      await AuditLogModel.create({
        actor_id: auth.user.id,
        action: 'product.deleted',
        entity: 'product',
        entity_id: id,
        metadata: { name: deleted.name, sku: deleted.sku },
      });
    }

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
