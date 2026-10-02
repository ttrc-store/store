'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, ProductModel, CouponModel } from '@/lib/mongodb/models';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { computeOrderTotals, calculateGstFromInclusive } from '@ttrc/shared';
import { getSiteSettingsAction } from './settings';

const CheckoutItemSchema = z.object({
  productId: z.string(),
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
  items: z.array(CheckoutItemSchema).min(1, 'Cart cannot be empty'),
  paymentMethod: z.enum(['razorpay', 'cod']),
  shippingAddress: ShippingAddressSchema,
  stateCode: z.string().default('33'),
  couponCode: z.string().max(50).optional(),
});

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export async function createOrderAction(raw: CreateOrderInput) {
  const validation = CreateOrderSchema.safeParse(raw);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { items, paymentMethod, shippingAddress, stateCode, couponCode } = validation.data;

  const auth = await getAuthenticatedUser();
  if ('error' in auth) {
    return { error: 'You must be logged in to place an order.' };
  }
  const user = auth.user;

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
      if (product.stock_quantity < item.quantity) {
        return {
          error: `"${product.name}" only has ${product.stock_quantity} units in stock.`,
        };
      }

      // Authoritative server-side bulk tier price calculation
      let effectiveUnitPrice = product.price;
      let bulkTierApplied: string | undefined = undefined;

      if (
        product.bulk_price_tiers &&
        Array.isArray(product.bulk_price_tiers) &&
        product.bulk_price_tiers.length > 0
      ) {
        // Sort descending by minQuantity to find the highest qualifying quantity tier
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
    const isFreeShipping = subtotalPaise >= freeShippingThreshold;
    const shippingPaise = isFreeShipping ? 0 : baseShipping;

    let couponDiscountPaise = 0;
    if (couponCode) {
      const coupon = await CouponModel.findOne({
        code: couponCode.toUpperCase().trim(),
        is_active: true,
      });

      if (coupon && subtotalPaise >= coupon.min_order_value_paise) {
        if (coupon.discount_type === 'percentage') {
          couponDiscountPaise = Math.round((subtotalPaise * coupon.discount_value) / 100);
        } else {
          couponDiscountPaise = coupon.discount_value;
        }
        couponDiscountPaise = Math.min(couponDiscountPaise, subtotalPaise);
      }
    }

    const totals = computeOrderTotals({
      itemSubtotalPaise: subtotalPaise,
      shippingPaise,
      codChargePaise: 0,
      couponDiscountPaise,
    });

    if (paymentMethod === 'cod' && totals.totalPaise > codMaxLimit) {
      return {
        error: `Cash on Delivery is limited to orders up to ₹${Math.round(codMaxLimit / 100)}.`,
      };
    }

    const isIntraState = stateCode === '33';
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of validatedItems) {
      const gst = calculateGstFromInclusive(
        item.lineTotal,
        (item.product.gst_percent || 18) as 0 | 5 | 12 | 18 | 28,
        !isIntraState
      );
      totalCgst += gst.cgstPaise;
      totalSgst += gst.sgstPaise;
      totalIgst += gst.igstPaise;
    }

    const orderNumber = `TTRC/25-26/${Date.now().toString().slice(-6)}`;

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

    const order = await OrderModel.create({
      order_number: orderNumber,
      user_id: user.id,
      status: paymentMethod === 'cod' ? 'processing' : 'pending',
      payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
      payment_method: paymentMethod,
      subtotal: subtotalPaise,
      discount_total: couponDiscountPaise,
      tax_total: totalCgst + totalSgst + totalIgst,
      shipping_total: shippingPaise,
      total: totals.totalPaise,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      items: orderItems,
    });

    // Decrement stock
    for (const item of validatedItems) {
      await ProductModel.findByIdAndUpdate(item.product._id, {
        $inc: { stock_quantity: -item.quantity },
      });
    }

    return {
      success: true,
      orderNumber,
      orderId: order._id.toString(),
      paymentMethod,
      amountPaise: totals.totalPaise,
    };
  } catch (err: any) {
    console.error('[Create Order Error]', err);
    return { error: 'Failed to place order. Please try again.' };
  }
}

export async function validateCouponAction(code: string, subtotalPaise: number) {
  if (!code?.trim()) return { error: 'Enter a coupon code.' };

  try {
    await connectToDatabase();
    const coupon = await CouponModel.findOne({
      code: code.toUpperCase().trim(),
      is_active: true,
    });

    if (!coupon) return { error: 'Coupon not found or inactive.' };
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

    order.status = 'cancelled';
    await order.save();

    return { success: true, orderNumber: order.order_number };
  } catch {
    return { error: 'Failed to cancel order.' };
  }
}
