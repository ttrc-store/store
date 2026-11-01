'use server';

import mongoose from 'mongoose';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { ProductModel, CategoryModel, OrderModel, UserModel, CouponModel, AuditLogModel } from '@/lib/mongodb/models';
import { requireAdmin, requireAdminReauth, revokeUserSessions } from '@/lib/auth-helpers';
import { ProductSchema, sanitizeVideoEmbedUrl } from '@/lib/video-utils';
import { revalidatePath } from 'next/cache';
import { invalidateCatalogCache } from '@/lib/mongodb/catalog';
import { notifySubscribersOnRestock } from '@/actions/stock-subscriptions';
import { sendOrderStatusUpdate } from '@/lib/email/resend';

function revalidateCatalog(slug?: string, oldSlug?: string) {
  try {
    invalidateCatalogCache();
    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/categories');
    revalidatePath('/search');
    revalidatePath('/cart');
    if (slug) {
      revalidatePath(`/product/${slug}`);
    }
    if (oldSlug && oldSlug !== slug) {
      revalidatePath(`/product/${oldSlug}`);
    }
  } catch (err) {
    console.error('Failed to revalidate catalog paths:', err);
  }
}

async function resolveProductCategories(
  categoryId?: string,
  subCategoryId?: string,
  categoryIds?: string[]
) {
  let mainCatSlug: string | undefined = undefined;
  let subCatSlug: string | undefined = subCategoryId;
  const set = new Set<string>();

  // 1. Process Main Category
  if (categoryId) {
    const isObjectId = mongoose.isValidObjectId(categoryId);
    const selectedCat = await CategoryModel.findOne({
      $or: [{ slug: categoryId }, ...(isObjectId ? [{ _id: categoryId }] : [])],
    }).lean();

    if (selectedCat) {
      if (selectedCat.parent_id) {
        const isParentObjectId = mongoose.isValidObjectId(selectedCat.parent_id);
        const parentCat = await CategoryModel.findOne({
          $or: [
            { slug: selectedCat.parent_id },
            ...(isParentObjectId ? [{ _id: selectedCat.parent_id }] : []),
          ],
        }).lean();

        mainCatSlug = parentCat ? parentCat.slug : selectedCat.slug;
        subCatSlug = selectedCat.slug;
        set.add(selectedCat.slug);
        set.add(selectedCat._id.toString());
        if (parentCat) {
          set.add(parentCat.slug);
          set.add(parentCat._id.toString());
        }
      } else {
        mainCatSlug = selectedCat.slug;
        set.add(selectedCat.slug);
        set.add(selectedCat._id.toString());
      }
    }
  }

  // 2. Process Subcategory
  if (subCategoryId) {
    const isSubObjId = mongoose.isValidObjectId(subCategoryId);
    const subCatDoc = await CategoryModel.findOne({
      $or: [{ slug: subCategoryId }, ...(isSubObjId ? [{ _id: subCategoryId }] : [])],
    }).lean();

    if (subCatDoc) {
      subCatSlug = subCatDoc.slug;
      set.add(subCatDoc.slug);
      set.add(subCatDoc._id.toString());

      if (!mainCatSlug && subCatDoc.parent_id) {
        const isParentObjectId = mongoose.isValidObjectId(subCatDoc.parent_id);
        const parentDoc = await CategoryModel.findOne({
          $or: [{ slug: subCatDoc.parent_id }, ...(isParentObjectId ? [{ _id: subCatDoc.parent_id }] : [])],
        }).lean();
        if (parentDoc) {
          mainCatSlug = parentDoc.slug;
          set.add(parentDoc.slug);
          set.add(parentDoc._id.toString());
        }
      }
    }
  }

  // 3. Process Multiple Additional Categories
  if (categoryIds && Array.isArray(categoryIds)) {
    for (const cid of categoryIds) {
      if (!cid || !cid.trim()) continue;
      const clean = cid.trim();
      set.add(clean);
      const isCidObj = mongoose.isValidObjectId(clean);
      const cDoc = await CategoryModel.findOne({
        $or: [{ slug: clean }, ...(isCidObj ? [{ _id: clean }] : [])],
      }).lean();
      if (cDoc) {
        set.add(cDoc.slug);
        set.add(cDoc._id.toString());
      }
    }
  }

  return {
    category_id: mainCatSlug || undefined,
    sub_category_id: subCatSlug || undefined,
    category_ids: set.size > 0 ? Array.from(set) : undefined,
  };
}

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

    const images = (data.imageUrls || []).filter(
      (img) => !img.includes('youtube.com') && !img.includes('youtu.be') && !img.includes('vimeo.com') && !img.includes('youtube-nocookie.com')
    );
    if (sanitizedVideo) {
      images.push(sanitizedVideo);
    }

    // Resolve category, subcategory, and multiple placements
    const { category_id, sub_category_id, category_ids } = await resolveProductCategories(
      data.categoryId,
      data.subCategoryId,
      data.categoryIds
    );

    const product = await ProductModel.create({
      name: data.name,
      slug: data.slug,
      sku: data.sku || `TTRC-PRD-${Date.now().toString().slice(-4)}`,
      product_type: data.productType === 'general' ? 'standard' : data.productType,
      unit: data.unit || 'Piece',
      status: data.status || 'published',
      category_id,
      sub_category_id,
      category_ids,
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
      documents: data.documents || [],
      in_box_items: data.in_box_items || [],
      applications: data.applications || [],
      certifications: data.certifications || [],
      images,
      media: data.media || [],
      meta_title: data.seoTitle || undefined,
      meta_description: data.seoDescription || undefined,
      primary_keyword: data.primaryKeyword || undefined,
      secondary_keywords: data.secondaryKeywords || [],
      search_questions: data.searchQuestions || [],
      seo_readiness_score: data.seoReadinessScore ?? undefined,
      ai_seo_status: data.aiSeoStatus || undefined,
      last_seo_audit: data.lastSeoAudit ? new Date(data.lastSeoAudit) : undefined,
      is_active: data.status !== 'archived',
      is_featured: true,
      is_new_arrival: true,
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

    revalidateCatalog(product.slug);

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

    const images = (data.imageUrls || []).filter(
      (img) => !img.includes('youtube.com') && !img.includes('youtu.be') && !img.includes('vimeo.com') && !img.includes('youtube-nocookie.com')
    );
    if (sanitizedVideo) {
      images.push(sanitizedVideo);
    }

    // Resolve category, subcategory, and multiple placements
    const { category_id, sub_category_id, category_ids } = await resolveProductCategories(
      data.categoryId,
      data.subCategoryId,
      data.categoryIds
    );

    // Synchronize default configuration pricing if variants exist in attributes
    let updatedAttributes = (existing as any).attributes;
    if (updatedAttributes?.configurations && Array.isArray(updatedAttributes.configurations)) {
      updatedAttributes = {
        ...updatedAttributes,
        configurations: updatedAttributes.configurations.map((c: any) => {
          if (c.is_default) {
            return {
              ...c,
              price_paise: data.pricePaise,
              mrp_paise: data.mrpPaise || data.pricePaise,
            };
          }
          return c;
        }),
      };
    }

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(updatedAttributes ? { attributes: updatedAttributes } : {}),
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          product_type: data.productType === 'general' ? 'standard' : data.productType,
          unit: data.unit || 'Piece',
          status: data.status || 'published',
          category_id,
          sub_category_id,
          category_ids,
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
          documents: data.documents || [],
          in_box_items: data.in_box_items || [],
          applications: data.applications || [],
          certifications: data.certifications || [],
          images,
          media: data.media || [],
          meta_title: data.seoTitle || undefined,
          meta_description: data.seoDescription || undefined,
          primary_keyword: data.primaryKeyword || undefined,
          secondary_keywords: data.secondaryKeywords || [],
          search_questions: data.searchQuestions || [],
          seo_readiness_score: data.seoReadinessScore ?? undefined,
          ai_seo_status: data.aiSeoStatus || undefined,
          last_seo_audit: data.lastSeoAudit ? new Date(data.lastSeoAudit) : undefined,
          is_active: data.status !== 'archived',
        },
      },
      { new: true }
    );

    if (!updated) {
      return { error: 'Product not found.' };
    }

    // Trigger back-in-stock notifications if item transitioned from <= 0 to > 0 stock
    if ((existing.stock_quantity ?? 0) <= 0 && data.stockQty > 0) {
      notifySubscribersOnRestock(id, updated.name, updated.slug, updated.price).catch((err) => {
        console.error('[Stock Alert Dispatch Warning]', err);
      });
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

    revalidateCatalog(data.slug, existing.slug);

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

    // Separate video from image URLs if present
    const rawImages = doc.images || [];
    let detectedVideoUrl: string | undefined = undefined;
    const cleanImageUrls: string[] = [];

    for (const img of rawImages) {
      if (
        img.includes('youtube.com') ||
        img.includes('youtu.be') ||
        img.includes('vimeo.com') ||
        img.includes('youtube-nocookie.com')
      ) {
        detectedVideoUrl = img;
      } else {
        cleanImageUrls.push(img);
      }
    }

    return {
      product: {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        sku: doc.sku,
        productType: doc.product_type,
        unit: doc.unit || 'Piece',
        categoryId: doc.category_id || undefined,
        subCategoryId: doc.sub_category_id || undefined,
        categoryIds: doc.category_ids || [],
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
        imageUrls: cleanImageUrls,
        videoUrl: detectedVideoUrl,
        media: doc.media || [],
        bulkPriceTiers: doc.bulk_price_tiers || [],
        specs: doc.technical_specs || [],
        documents: (doc.documents || []).map((d: any) => ({
          id: d.id,
          type: d.type,
          title: d.title,
          fileUrl: d.file_url,
          fileFormat: d.file_format,
          fileSizeBytes: d.file_size_bytes,
          version: d.version,
          isVerified: d.is_verified,
        })),
        inBoxItems: (doc.in_box_items || []).map((item: any) => ({
          itemName: item.item_name,
          quantity: item.quantity,
          notes: item.notes,
        })),
        applications: doc.applications || [],
        certifications: doc.certifications || [],
        modelNumber: doc.model_number,
        partNumber: doc.part_number,
        voltage: doc.voltage,
        current: doc.current,
        material: doc.material,
        dimensions: doc.dimensions,
        warranty: doc.warranty,
        seoTitle: doc.meta_title,
        seoDescription: doc.meta_description,
        primaryKeyword: doc.primary_keyword,
        secondaryKeywords: doc.secondary_keywords || [],
        searchQuestions: doc.search_questions || [],
        seoReadinessScore: doc.seo_readiness_score,
        aiSeoStatus: doc.ai_seo_status,
        lastSeoAudit: doc.last_seo_audit ? doc.last_seo_audit.toISOString() : undefined,
        attributes: doc.attributes || {},
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
      revalidateCatalog(updated.slug);
    } else {
      revalidateCatalog();
    }

    return { success: true };
  } catch {
    return { error: 'Failed to archive product.' };
  }
}

export async function deleteProductAction(id: string, adminPassword?: string) {
  if (!id) return { error: 'Product ID is required' };

  // Reauthentication challenge for product deletion (SEC-06)
  const auth = await requireAdminReauth(adminPassword);
  if ('error' in auth) return { error: auth.error, requiresReauth: 'requiresReauth' in auth };

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
      revalidateCatalog(deleted.slug);
    } else {
      revalidateCatalog();
    }

    return { success: true };
  } catch {
    return { error: 'Failed to delete product.' };
  }
}

// ─── Order Management ─────────────────────────────────────────────────────────

// ─── Order Management ─────────────────────────────────────────────────────────

const ALLOWED_ORDER_STATUSES = new Set([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'return_requested',
  'returned',
]);

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string,
  trackingNumber?: string,
  adminNote?: string,
  adminPassword?: string
) {
  if (!orderId) return { error: 'Order ID is required' };

  const targetStatus = newStatus.trim().toLowerCase();
  // Require reauthentication for high-impact status changes (refunded, cancelled) (SEC-06)
  const isHighImpact = targetStatus === 'refunded' || targetStatus === 'cancelled';
  const auth = isHighImpact ? await requireAdminReauth(adminPassword) : await requireAdmin();
  if ('error' in auth) {
    return {
      error: auth.error,
      ...('requiresReauth' in auth && auth.requiresReauth ? { requiresReauth: true } : {}),
    };
  }

  if (!ALLOWED_ORDER_STATUSES.has(targetStatus)) {
    return { error: `Invalid order status "${newStatus}". Allowed: ${Array.from(ALLOWED_ORDER_STATUSES).join(', ')}` };
  }

  try {
    await connectToDatabase();

    const order = await OrderModel.findById(orderId);
    if (!order) return { error: 'Order not found in database.' };

    const oldStatus = order.status;

    // Guard: Prevent arbitrary transitions on terminal orders
    if (oldStatus === 'cancelled' && targetStatus !== 'cancelled') {
      return { error: 'Cancelled orders are terminal and cannot be reopened. Please place a new order if needed.' };
    }
    if (oldStatus === 'refunded' && targetStatus !== 'refunded') {
      return { error: 'Refunded orders are terminal and cannot change status.' };
    }

    // Guard: Payment integrity enforcement (Section 6)
    // Never allow an order to be marked as processing, shipped, or delivered if it's an unpaid online transaction
    const isUnpaidOnline = order.payment_method !== 'cod' && order.payment_status !== 'paid';
    if (isUnpaidOnline && (targetStatus === 'processing' || targetStatus === 'shipped' || targetStatus === 'delivered')) {
      return {
        error: `Cannot transition unpaid online order (${order.payment_status}) to "${targetStatus}". Payment must be authoritatively verified by Razorpay first.`,
      };
    }

    // Shipping fulfillment requirement
    if (targetStatus === 'shipped' && !trackingNumber && !order.tracking_number) {
      console.warn(`[Order Fulfillment] Order ${order.order_number} marked as shipped without tracking reference.`);
    }

    // Automated inventory restocking on order cancellation
    if (targetStatus === 'cancelled' && oldStatus !== 'cancelled') {
      if (Array.isArray(order.items) && order.items.length > 0) {
        for (const item of order.items) {
          if (item.product_id && item.quantity > 0) {
            await ProductModel.findByIdAndUpdate(item.product_id, {
              $inc: { stock_quantity: item.quantity },
            });
            await AuditLogModel.create({
              actor_id: auth.user.id,
              action: 'inventory.restocked.order_cancelled',
              entity: 'product',
              entity_id: item.product_id,
              metadata: {
                orderNumber: order.order_number,
                restockedQty: item.quantity,
                reason: `Order ${order.order_number} was cancelled by administrator.`,
              },
            });
          }
        }
      }
    }

    // Update order state
    order.status = targetStatus as any;
    if (trackingNumber) {
      order.tracking_number = trackingNumber.trim();
      order.tracking_url = `https://shiprocket.co/tracking/${encodeURIComponent(trackingNumber.trim())}`;
    }

    if (adminNote && adminNote.trim()) {
      const timestamp = new Date().toLocaleString('en-IN');
      const formattedNote = `[${timestamp} — ${auth.user.fullName || auth.user.email}]: ${adminNote.trim()}`;
      order.notes = order.notes ? `${order.notes}\n${formattedNote}` : formattedNote;
    }

    await order.save();

    // Send shipment notification email if transition to shipped
    if (targetStatus === 'shipped' && !order.shipment_email_sent) {
      const recipientEmail = order.shipping_address?.email || order.guest_email;
      if (recipientEmail) {
        try {
          await sendOrderStatusUpdate({
            toEmail: recipientEmail,
            customerName: order.shipping_address?.fullName || 'Customer',
            orderNumber: order.order_number,
            status: 'shipped',
            courierName: 'Shiprocket',
            trackingNumber: trackingNumber || order.tracking_number,
            trackingUrl: order.tracking_url,
          });
          order.shipment_email_sent = true;
          order.shipment_email_sent_at = new Date();
          await order.save();
        } catch (emailErr) {
          console.warn('[updateOrderStatusAction] Shipment email dispatch failed:', emailErr);
        }
      }
    }

    // Record audit log
    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'order.status_updated',
      entity: 'order',
      entity_id: orderId,
      metadata: {
        orderNumber: order.order_number,
        oldStatus,
        newStatus: targetStatus,
        trackingNumber: trackingNumber || order.tracking_number,
        adminNote: adminNote || undefined,
        actorEmail: auth.user.email,
      },
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}`);

    return {
      success: true,
      orderNumber: order.order_number,
      newStatus: targetStatus,
    };
  } catch (err: any) {
    console.error('[Admin updateOrderStatus error]', err);
    return { error: err.message || 'Failed to update order status.' };
  }
}

export async function disableCustomerAction(userId: string, adminPassword?: string) {
  if (!userId) return { error: 'User ID is required' };

  const auth = await requireAdminReauth(adminPassword);
  if ('error' in auth) return { error: auth.error, requiresReauth: 'requiresReauth' in auth };

  try {
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(userId, { $set: { role: 'customer' } });
    await revokeUserSessions(userId); // Invalidate active sessions immediately
    return { success: true, message: 'Customer account updated and sessions revoked.' };
  } catch {
    return { error: 'Failed to disable customer.' };
  }
}

export async function adjustInventoryAction(
  productId: string,
  delta: number,
  reason?: string
) {
  if (!productId) return { error: 'Product ID is required' };
  if (typeof delta !== 'number' || isNaN(delta) || delta === 0) {
    return { error: 'A non-zero stock adjustment quantity is required.' };
  }

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const product = await ProductModel.findById(productId);
    if (!product) return { error: 'Product not found.' };

    const oldQty = product.stock_quantity;
    const newQty = oldQty + delta;
    if (newQty < 0) {
      return { error: `Cannot reduce stock below 0. Current stock is ${oldQty}, requested decrement: ${Math.abs(delta)}.` };
    }

    // Atomic conditional update to prevent race conditions
    const updated = await ProductModel.findOneAndUpdate(
      {
        _id: productId,
        stock_quantity: { $gte: delta < 0 ? Math.abs(delta) : 0 },
      },
      { $inc: { stock_quantity: delta } },
      { new: true }
    );

    if (!updated) {
      return { error: 'Concurrent inventory modification detected. Please refresh and try again.' };
    }

    const adjustmentReason = reason?.trim() || 'Manual stock adjustment by administrator';

    // Record inventory audit history
    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'inventory.adjusted',
      entity: 'product',
      entity_id: productId,
      metadata: {
        productName: updated.name,
        sku: updated.sku,
        oldStock: oldQty,
        newStock: updated.stock_quantity,
        delta,
        reason: adjustmentReason,
        actorEmail: auth.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath(`/product/${updated.slug}`);

    return {
      success: true,
      newQty: updated.stock_quantity,
      message: `Stock updated for ${updated.name}: ${oldQty} → ${updated.stock_quantity} (${delta > 0 ? `+${delta}` : delta}).`,
    };
  } catch (err: any) {
    console.error('[Admin adjustInventory error]', err);
    return { error: err.message || 'Failed to adjust inventory.' };
  }
}

export async function bulkArchiveProductsAction(productIds: string[]) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { error: 'No products selected.' };
  }

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const result = await ProductModel.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: 'archived', is_active: false } }
    );

    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'product.bulk_archived',
      entity: 'product',
      entity_id: 'bulk',
      metadata: { count: result.modifiedCount, productIds, actorEmail: auth.user.email },
    });

    revalidatePath('/admin/products');
    return { success: true, count: result.modifiedCount };
  } catch (err: any) {
    return { error: err.message || 'Failed to archive selected products.' };
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
