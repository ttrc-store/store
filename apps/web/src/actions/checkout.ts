'use server';

import crypto from 'crypto';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, ProductModel, CouponModel } from '@/lib/mongodb/models';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { computeOrderTotals, calculateGstFromInclusive } from '@ttrc/shared';
import { getSiteSettingsAction } from './settings';

import { checkRateLimit } from '@/lib/security/rate-limiter';
import { getNextSequenceId } from '@/lib/id-generator';

const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(99),
});

const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-]{10,15}$/, 'Enter a valid Indian phone number'),
  line1: z.string().min(5, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
});

const CreateOrderSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'Cart cannot be empty').max(50),
  paymentMethod: z.string().default('razorpay'),
  shippingAddress: ShippingAddressSchema,
  billingAddress: ShippingAddressSchema.optional(),
  stateCode: z.string().regex(/^\d{2}$/, 'Valid 2-digit state code required').default('33'),
  couponCode: z.string().max(50).optional(),
  guestEmail: z.string().email('Please enter a valid email address').optional(),
  companyGst: z
    .object({
      companyName: z.string().min(2, 'Company name is required').max(100),
      gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid 15-character GSTIN format'),
    })
    .optional(),
  existingPendingOrderId: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export async function createOrderAction(raw: CreateOrderInput) {
  const validation = CreateOrderSchema.safeParse(raw);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { items, paymentMethod, shippingAddress, billingAddress, stateCode, couponCode, guestEmail, companyGst, existingPendingOrderId } = validation.data;

  // Strict enforcement: Cash on Delivery is not supported on TTRC Store
  if (paymentMethod !== 'razorpay') {
    return {
      error: 'Cash on Delivery is not offered on TTRC Store. Please pay securely online using Razorpay (UPI, Google Pay, Cards, NetBanking).',
    };
  }

  const auth = await getAuthenticatedUser();
  const isAuthenticated = !('error' in auth);
  const user = isAuthenticated ? auth.user : null;

  if (!isAuthenticated && !guestEmail) {
    return { error: 'Please provide an email address for guest checkout or sign in to your account.' };
  }

  // If retrying with an existing pending order, check if it can be safely reused without double stock deduction
  if (existingPendingOrderId) {
    try {
      await connectToDatabase();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(existingPendingOrderId);
      const query: any = {
        $and: [
          {
            $or: [
              ...(isObjectId ? [{ _id: existingPendingOrderId }] : []),
              { order_number: existingPendingOrderId },
            ],
          },
          { status: 'pending', payment_status: 'pending' },
        ],
      };
      if (user) {
        query.$and.push({ user_id: user.id });
      } else if (guestEmail) {
        query.$and.push({ guest_email: guestEmail.toLowerCase().trim() });
      }

      const existingOrder = await OrderModel.findOne(query);
      if (existingOrder) {
        return {
          success: true,
          orderNumber: existingOrder.order_number,
          orderId: existingOrder._id.toString(),
          paymentMethod: 'razorpay',
          amountPaise: existingOrder.total,
        };
      }
    } catch {
      // Continue with standard creation if reuse check encounters an issue
    }
  } else {
    // Automatic deduplication for fresh retries where client activePendingOrderId was lost on page reload
    try {
      await connectToDatabase();
      const recentThreshold = new Date(Date.now() - 15 * 60 * 1000);
      const recentQuery: any = {
        status: 'pending',
        payment_status: 'pending',
        created_at: { $gt: recentThreshold },
      };
      if (user) {
        recentQuery.user_id = user.id;
      } else if (guestEmail) {
        recentQuery.guest_email = guestEmail.toLowerCase().trim();
      }
      const recentOrder = await OrderModel.findOne(recentQuery).sort({ created_at: -1 });
      if (recentOrder) {
        const existingItems = recentOrder.items || [];
        const isExactMatch =
          existingItems.length > 0 &&
          existingItems.length === items.length &&
          items.every((it) => {
            const match = existingItems.find((e: any) => e.product_id === it.productId);
            return match && match.quantity === it.quantity;
          });

        if (isExactMatch) {
          return {
            success: true,
            orderNumber: recentOrder.order_number,
            orderId: recentOrder._id.toString(),
            paymentMethod: 'razorpay',
            amountPaise: recentOrder.total,
          };
        }
      }
    } catch {
      // Continue with standard creation
    }
  }

  // Rate limit: 5 order attempts per minute per user / guest phone
  const rateLimitKey = user
    ? `create-order:${user.id}`
    : `create-order:guest:${shippingAddress.phone.replace(/\D/g, '') || guestEmail}`;

  const rateLimit = await checkRateLimit({
    key: rateLimitKey,
    limit: 5,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.success) {
    return { error: 'Order creation rate limit exceeded. Please wait a minute before retrying.' };
  }

  try {
    await connectToDatabase();

    const settings = await getSiteSettingsAction();
    const freeShippingThreshold = settings.free_shipping_threshold_paise;
    const baseShipping = settings.base_shipping_paise;
    const codMaxLimit = settings.cod_max_limit_paise;

    const productIds = items.map((i) => i.productId);
    const dbProducts = await ProductModel.find({
      _id: { $in: productIds },
      is_active: true,
    }).lean();

    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    const validatedItems = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return { error: 'One or more items in your cart are unavailable.' };
      }

      // Authoritative server-side bulk tier price calculation
      let effectiveUnitPrice = product.price;
      let bulkTierApplied: string | undefined = undefined;

      if (
        product.bulk_price_tiers &&
        Array.isArray(product.bulk_price_tiers) &&
        product.bulk_price_tiers.length > 0
      ) {
        const sortedTiers = [...product.bulk_price_tiers].sort(
          (a, b) => b.minQuantity - a.minQuantity
        );
        const matchedTier = sortedTiers.find((t) => item.quantity >= t.minQuantity);
        if (matchedTier) {
          effectiveUnitPrice = matchedTier.unitPricePaise;
          bulkTierApplied = `${matchedTier.minQuantity}+ pcs tier`;
        }
      }

      const lineTotal = effectiveUnitPrice * item.quantity;

      validatedItems.push({
        product,
        quantity: item.quantity,
        effectiveUnitPrice,
        bulkTierApplied,
        lineTotal,
      });
    }

    const subtotalPaise = validatedItems.reduce((s, i) => s + i.lineTotal, 0);
    // Standard shipping is always applied across all orders (no free shipping)
    const shippingPaise = baseShipping || 5900;

    let couponDiscountPaise = 0;
    let appliedCouponDoc: any = null;
    if (couponCode) {
      const cleanCode = couponCode.toUpperCase().trim();
      const now = new Date();
      const coupon = await CouponModel.findOne({
        code: cleanCode,
        is_active: true,
        $or: [
          { expires_at: { $exists: false } },
          { expires_at: null },
          { expires_at: { $gt: now } },
        ],
      });

      if (coupon && subtotalPaise >= coupon.min_order_value_paise) {
        if (coupon.discount_type === 'percentage') {
          couponDiscountPaise = Math.round((subtotalPaise * coupon.discount_value) / 100);
        } else {
          couponDiscountPaise = coupon.discount_value;
        }
        if (coupon.max_discount_paise && coupon.max_discount_paise > 0) {
          couponDiscountPaise = Math.min(couponDiscountPaise, coupon.max_discount_paise);
        }
        couponDiscountPaise = Math.min(couponDiscountPaise, subtotalPaise);
        appliedCouponDoc = coupon;
      }
    }

    const isIntraState = stateCode === '33';
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of validatedItems) {
      const gstPercent = Number(item.product.gst_percent || 18);
      const lineTax = Math.round((item.lineTotal * gstPercent) / 100);
      if (isIntraState) {
        const half = Math.round(lineTax / 2);
        totalCgst += half;
        totalSgst += (lineTax - half);
      } else {
        totalIgst += lineTax;
      }
    }

    const totalTaxPaise = totalCgst + totalSgst + totalIgst;
    const finalOrderTotalPaise = Math.max(0, subtotalPaise + shippingPaise + totalTaxPaise - couponDiscountPaise);

    // Atomic stock deduction to prevent race condition / overselling
    const decrementedItems: Array<{ productId: any; quantity: number }> = [];
    for (const item of validatedItems) {
      const updatedProduct = await ProductModel.findOneAndUpdate(
        {
          _id: item.product._id,
          stock_quantity: { $gte: item.quantity },
          is_active: true,
        },
        { $inc: { stock_quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback any previously decremented items
        for (const dec of decrementedItems) {
          await ProductModel.findByIdAndUpdate(dec.productId, {
            $inc: { stock_quantity: dec.quantity },
          });
        }
        return {
          error: `Insufficient stock for "${item.product.name}". Please adjust quantity.`,
        };
      }
      decrementedItems.push({ productId: item.product._id, quantity: item.quantity });
    }

    // Atomically increment coupon usage if used
    if (appliedCouponDoc) {
      await CouponModel.findByIdAndUpdate(appliedCouponDoc._id, {
        $inc: { usage_count: 1 },
      });
    }

    const orderNumber = await getNextSequenceId('ORD');

    const orderItems = validatedItems.map((item) => ({
      product_id: item.product._id.toString(),
      product_name: item.product.name,
      sku: item.product.sku,
      unit_price: item.effectiveUnitPrice,
      mrp_price: item.product.compare_at_price,
      bulk_tier_applied: item.bulkTierApplied,
      quantity: item.quantity,
      total_price: item.lineTotal,
      gst_percent: item.product.gst_percent || 18,
      hsn_code: item.product.hsn_code || '8542',
      is_spare_part: item.product.product_type === 'spare_part',
      image_url: item.product.images?.[0],
    }));

    // Generate cryptographically secure guest invoice token
    const guestInvoiceToken = crypto.randomBytes(32).toString('hex');
    const guestInvoiceTokenHash = crypto.createHash('sha256').update(guestInvoiceToken).digest('hex');

    const order = await OrderModel.create({
      order_number: orderNumber,
      user_id: user ? user.id : undefined,
      guest_email: !user && guestEmail ? guestEmail.toLowerCase().trim() : undefined,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'razorpay',
      subtotal: subtotalPaise,
      discount_total: couponDiscountPaise,
      tax_total: totalTaxPaise,
      shipping_total: shippingPaise,
      total: finalOrderTotalPaise,
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      guest_invoice_token_hash: guestInvoiceTokenHash,
      notes: companyGst ? `GST Invoice Request: ${companyGst.companyName} (GSTIN: ${companyGst.gstin})` : undefined,
      items: orderItems,
    });

    return {
      success: true,
      orderNumber,
      orderId: order._id.toString(),
      paymentMethod,
      amountPaise: finalOrderTotalPaise,
      invoiceToken: guestInvoiceToken,
    };
  } catch (err: any) {
    console.error('[Create Order Error]', err);
    return { error: 'Failed to place order. Please try again.' };
  }
}

export async function validateCouponAction(code: string, subtotalPaise: number) {
  if (!code?.trim()) return { error: 'Enter a coupon code.' };

  const rateLimit = await checkRateLimit({
    key: `coupon:${code.trim().toUpperCase()}`,
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.success) {
    return { error: 'Too many coupon check attempts. Please wait.' };
  }

  try {
    await connectToDatabase();
    const now = new Date();
    const coupon = await CouponModel.findOne({
      code: code.toUpperCase().trim(),
      is_active: true,
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: now } },
      ],
    });

    if (!coupon) return { error: 'Coupon not found, expired, or inactive.' };
    if (subtotalPaise < coupon.min_order_value_paise) {
      return {
        error: `Minimum order of ₹${Math.round(coupon.min_order_value_paise / 100)} required.`,
      };
    }

    let discountPaise = 0;
    if (coupon.discount_type === 'percentage') {
      discountPaise = Math.round((subtotalPaise * coupon.discount_value) / 100);
    } else {
      discountPaise = coupon.discount_value;
    }

    if (coupon.max_discount_paise && coupon.max_discount_paise > 0) {
      discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
    }

    discountPaise = Math.min(discountPaise, subtotalPaise);

    return {
      success: true,
      discountPaise,
      message: `Coupon "${code.toUpperCase()}" applied! You save ₹${(discountPaise / 100).toFixed(2)}.`,
    };
  } catch {
    return { error: 'Failed to validate coupon.' };
  }
}

export async function cancelOrderAction(orderId: string) {
  if (!orderId) return { error: 'Order ID is required.' };

  const auth = await getAuthenticatedUser();
  if ('error' in auth) return { error: 'Unauthenticated.' };

  try {
    await connectToDatabase();
    const order = await OrderModel.findOne({ _id: orderId, user_id: auth.user.id });
    if (!order) return { error: 'Order not found.' };

    // Customers can only cancel pending or processing orders (never shipped/delivered)
    if (order.status !== 'pending' && order.status !== 'processing') {
      return {
        error: `Order in status "${order.status}" cannot be cancelled. Contact support for assistance.`,
      };
    }

    order.status = 'cancelled';
    await order.save();

    // Restock items atomically
    for (const item of order.items) {
      await ProductModel.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: item.quantity },
      });
    }

    return { success: true, orderNumber: order.order_number };
  } catch {
    return { error: 'Failed to cancel order.' };
  }
}

export async function releasePendingOrderAction(orderId: string, guestEmail?: string) {
  if (!orderId) return { error: 'Order ID is required.' };

  const auth = await getAuthenticatedUser();
  const isAuthenticated = !('error' in auth);
  const user = isAuthenticated ? auth.user : null;

  try {
    await connectToDatabase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const query: any = {
      $and: [
        {
          $or: [
            ...(isObjectId ? [{ _id: orderId }] : []),
            { order_number: orderId },
          ],
        },
        { status: 'pending', payment_status: 'pending' },
      ],
    };

    if (user) {
      query.$and.push({ user_id: user.id });
    } else if (guestEmail) {
      query.$and.push({ guest_email: guestEmail.toLowerCase().trim() });
    }

    const order = await OrderModel.findOneAndUpdate(
      query,
      {
        $set: {
          status: 'cancelled',
          payment_status: 'failed',
        },
      },
      { new: false }
    );
    if (!order) {
      return { error: 'Pending order not found or already completed.' };
    }

    order.notes = (order.notes ? order.notes + ' | ' : '') + 'Payment window dismissed or cancelled by customer. Inventory released.';
    await order.save();

    // Restock all reserved items atomically
    for (const item of order.items) {
      await ProductModel.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: item.quantity },
      });
    }

    return { success: true, message: 'Reserved stock restored successfully.' };
  } catch (err: any) {
    console.error('[Release Pending Order Error]', err);
    return { error: 'Failed to release pending order.' };
  }
}

export async function cleanupExpiredPendingOrdersAction(maxAgeMinutes = 30) {
  try {
    await connectToDatabase();
    const expiryThreshold = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const expiredOrders = await OrderModel.find({
      status: 'pending',
      payment_status: 'pending',
      created_at: { $lt: expiryThreshold },
    }).lean();

    let releasedCount = 0;
    for (const order of expiredOrders) {
      const atomicOrder = await OrderModel.findOneAndUpdate(
        {
          _id: order._id,
          status: 'pending',
          payment_status: 'pending',
        },
        {
          $set: {
            status: 'cancelled',
            payment_status: 'failed',
            notes: `Auto-cancelled after ${maxAgeMinutes} minutes of checkout inactivity. Inventory released.`,
          },
        },
        { new: false }
      );

      if (atomicOrder) {
        for (const item of atomicOrder.items) {
          await ProductModel.findByIdAndUpdate(item.product_id, {
            $inc: { stock_quantity: item.quantity },
          });
        }
        releasedCount++;
      }
    }

    return { success: true, releasedCount };
  } catch (err: any) {
    console.error('[Cleanup Expired Orders Error]', err);
    return { error: 'Failed to cleanup expired orders.' };
  }
}

