'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { computeOrderTotals, calculateGstFromInclusive } from '@ttrc/shared';
import { getSiteSettingsAction } from './settings';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CheckoutItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid().nullable().optional(),
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
  stateCode: z.string().default('33'), // 33 = Tamil Nadu
  couponCode: z.string().max(50).optional(),
  idempotencyKey: z.string().uuid('Must be a valid UUID').optional(),
});

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartProductRow {
  id: string;
  name: string;
  sku: string;
  price_paise: number;
  mrp_paise: number | null;
  gst_percent: number;
  hsn_code: string | null;
  stock_qty: number;
  status: string;
  image_url?: string;
}

// ─── Coupon validation (server-authoritative) ─────────────────────────────────

async function validateCoupon(
  supabase: Awaited<ReturnType<typeof createClient>>,
  couponCode: string,
  userId: string,
  subtotalPaise: number
): Promise<{ discountPaise: number; couponId: string } | { error: string }> {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', couponCode.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { error: 'Coupon not found or inactive.' };
  }

  // Expiry check
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { error: 'This coupon has expired.' };
  }

  // Minimum order check
  if (subtotalPaise < coupon.min_order_paise) {
    const minRupees = Math.round(coupon.min_order_paise / 100);
    return { error: `Minimum order of ₹${minRupees} required for this coupon.` };
  }

  // Global usage limit
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { error: 'This coupon has reached its usage limit.' };
  }

  // Per-user usage limit
  if (coupon.uses_per_user !== null) {
    const { count } = await supabase
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);

    if ((count ?? 0) >= coupon.uses_per_user) {
      return { error: 'You have already used this coupon the maximum number of times.' };
    }
  }

  // Calculate discount
  let discountPaise = 0;
  if (coupon.type === 'percent') {
    discountPaise = Math.round((subtotalPaise * coupon.value) / 100);
  } else {
    discountPaise = coupon.value; // flat paise amount
  }

  // Ensure discount doesn't exceed subtotal
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { discountPaise, couponId: coupon.id };
}

// ─── Main order creation action ───────────────────────────────────────────────

export async function createOrderAction(raw: CreateOrderInput) {
  // 1. Validate input
  const validation = CreateOrderSchema.safeParse(raw);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { items, paymentMethod, shippingAddress, stateCode, couponCode, idempotencyKey } =
    validation.data;

  const supabase = await createClient();

  // 2. Authenticate user (checkout requires login)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to place an order.' };
  }

  // 3. Idempotency: check if we already created an order with this key
  if (idempotencyKey) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('user_id', user.id)
      .filter('admin_note', 'like', `%idempotency:${idempotencyKey}%`)
      .maybeSingle();

    if (existingOrder) {
      return {
        success: true,
        orderNumber: existingOrder.order_number,
        orderId: existingOrder.id,
        paymentMethod,
      };
    }
  }

  // 4. Read site settings for shipping/COD limits
  const settings = await getSiteSettingsAction();
  const freeShippingThreshold = settings.free_shipping_threshold_paise;
  const baseShipping = settings.base_shipping_paise;
  const codMaxLimit = settings.cod_max_limit_paise;

  // 5. Load real product data from DB (authoritative pricing)
  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, price_paise, mrp_paise, gst_percent, hsn_code, stock_qty, status')
    .in('id', productIds)
    .eq('status', 'published');

  if (productsError) {
    return { error: 'Failed to verify product data. Please try again.' };
  }

  const productMap = new Map<string, CartProductRow>(
    (products ?? []).map((p) => [p.id, p])
  );

  // 6. Validate each item: exists, in stock, published
  const validatedItems: Array<{
    product: CartProductRow;
    quantity: number;
    variantId: string | null;
    lineTotal: number;
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: `Product not found or no longer available.` };
    }
    if (product.status !== 'published') {
      return { error: `"${product.name}" is no longer available.` };
    }
    if (product.stock_qty < item.quantity) {
      return {
        error: `"${product.name}" only has ${product.stock_qty} units in stock. Please reduce quantity.`,
      };
    }
    validatedItems.push({
      product,
      quantity: item.quantity,
      variantId: item.variantId ?? null,
      lineTotal: product.price_paise * item.quantity,
    });
  }

  // 7. Compute server-authoritative totals (integer paise only)
  const subtotalPaise = validatedItems.reduce((s, i) => s + i.lineTotal, 0);
  const isFreeShipping = subtotalPaise >= freeShippingThreshold;
  const shippingPaise = isFreeShipping ? 0 : baseShipping;

  // 8. Validate coupon server-side
  let couponDiscountPaise = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const couponResult = await validateCoupon(supabase, couponCode, user.id, subtotalPaise);
    if ('error' in couponResult) {
      return { error: couponResult.error };
    }
    couponDiscountPaise = couponResult.discountPaise;
    couponId = couponResult.couponId;
  }

  // 9. Validate payment method
  const razorpayEnabled =
    settings.razorpay_enabled && Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  if (paymentMethod === 'razorpay' && !razorpayEnabled) {
    return { error: 'Online payment is not available at this time. Please select Cash on Delivery.' };
  }

  // 10. Compute final totals
  const totals = computeOrderTotals({
    itemSubtotalPaise: subtotalPaise,
    shippingPaise,
    codChargePaise: paymentMethod === 'cod' ? 0 : 0, // COD fee configurable via settings
    couponDiscountPaise,
  });

  // 11. COD limit check
  if (paymentMethod === 'cod' && totals.totalPaise > codMaxLimit) {
    const limitRupees = Math.round(codMaxLimit / 100);
    return {
      error: `Cash on Delivery is limited to orders up to ₹${limitRupees}. Please use online payment.`,
    };
  }

  // 12. Compute GST (always store even if display is disabled)
  const isIntraState = stateCode === '33'; // Tamil Nadu
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTaxable = 0;

  for (const item of validatedItems) {
    const gst = calculateGstFromInclusive(
      item.lineTotal,
      item.product.gst_percent as 0 | 5 | 12 | 18 | 28,
      !isIntraState
    );
    totalTaxable += gst.taxableAmountPaise;
    totalCgst += gst.cgstPaise;
    totalSgst += gst.sgstPaise;
    totalIgst += gst.igstPaise;
  }

  // 13. Snapshot shipping address
  const addressSnap = {
    full_name: shippingAddress.fullName,
    phone: shippingAddress.phone,
    line1: shippingAddress.line1,
    line2: shippingAddress.line2 ?? null,
    city: shippingAddress.city,
    state: shippingAddress.state,
    pincode: shippingAddress.pincode,
    state_code: stateCode,
  };

  // 14. Write order to database (single transaction attempt)
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment',
      shipping_address_snap: addressSnap,
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      discount_paise: couponDiscountPaise,
      taxable_paise: totalTaxable,
      cgst_paise: totalCgst,
      sgst_paise: totalSgst,
      igst_paise: totalIgst,
      total_gst_paise: totalCgst + totalSgst + totalIgst,
      total_paise: totals.totalPaise,
      coupon_code: couponCode ?? null,
      coupon_discount_paise: couponDiscountPaise,
      payment_method: paymentMethod,
      admin_note: idempotencyKey ? `idempotency:${idempotencyKey}` : null,
    })
    .select('id')
    .single();

  if (orderError || !orderData) {
    console.error('[TTRC Checkout] Order insert failed:', orderError);
    return { error: 'Failed to create order. Please try again.' };
  }

  const orderId = orderData.id;

  // 15. Generate order number using DB function
  const { data: orderNumData } = await supabase
    .rpc('next_order_number')
    .single();

  const orderNumber = (orderNumData as string) ?? `TTRC/25-26/${Date.now()}`;

  await supabase
    .from('orders')
    .update({ order_number: orderNumber })
    .eq('id', orderId);

  // 16. Insert order items (product snapshot)
  const orderItemsToInsert = validatedItems.map((item) => ({
    order_id: orderId,
    product_id: item.product.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price_paise: item.product.price_paise,
    gst_percent: item.product.gst_percent,
    hsn_code: item.product.hsn_code,
    snapshot_name: item.product.name,
    snapshot_sku: item.product.sku,
    snapshot_image_url: null,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsToInsert);

  if (itemsError) {
    console.error('[TTRC Checkout] Order items insert failed:', itemsError);
    // Attempt rollback by deleting the order
    await supabase.from('orders').delete().eq('id', orderId);
    return { error: 'Failed to save order items. Please try again.' };
  }

  // 17. Decrement stock for each product (atomic per product)
  for (const item of validatedItems) {
    const { error: stockError } = await supabase.rpc('decrement_stock', {
      p_product_id: item.product.id,
      p_quantity: item.quantity,
    });

    if (stockError) {
      // Stock decrement failed — log but don't block (admin can reconcile)
      console.error(
        `[TTRC Checkout] Stock decrement failed for product ${item.product.id}:`,
        stockError
      );
    }

    // Record inventory movement
    await supabase.from('inventory_movements').insert({
      product_id: item.product.id,
      delta: -item.quantity,
      reason: 'sale',
      reference: orderId,
      user_id: user.id,
    });
  }

  // 18. Create initial payment record for Razorpay orders
  let razorpayOrderId: string | null = null;
  if (paymentMethod === 'razorpay' && razorpayEnabled) {
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount_paise: totals.totalPaise,
        status: 'pending',
        method: 'razorpay',
      })
      .select('id')
      .single();

    if (paymentError) {
      console.error('[TTRC Checkout] Payment record insert failed:', paymentError);
    }

    // Create Razorpay order via their API
    // (Only if keys are available; otherwise just store pending)
    const rpKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rpSecret = process.env.RAZORPAY_KEY_SECRET;

    if (rpKeyId && rpSecret) {
      try {
        const credentials = Buffer.from(`${rpKeyId}:${rpSecret}`).toString('base64');
        const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totals.totalPaise,
            currency: 'INR',
            receipt: orderNumber,
          }),
        });

        if (rpRes.ok) {
          const rpOrder = await rpRes.json();
          razorpayOrderId = rpOrder.id;

          await supabase
            .from('orders')
            .update({ razorpay_order_id: razorpayOrderId })
            .eq('id', orderId);

          if (paymentData) {
            await supabase
              .from('payments')
              .update({ razorpay_order_id: razorpayOrderId })
              .eq('id', paymentData.id);
          }
        }
      } catch (err) {
        console.error('[TTRC Checkout] Razorpay order creation failed:', err);
      }
    }
  }

  // 19. Redeem coupon
  if (couponId && couponCode) {
    await supabase
      .from('coupon_redemptions')
      .insert({ coupon_id: couponId, user_id: user.id, order_id: orderId });

    // Increment coupon usage counter
    await supabase.rpc('increment_coupon_uses', { p_coupon_id: couponId });
  }

  // 20. Create initial order event
  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: 'order_created',
    actor_id: user.id,
    actor_role: 'customer',
    meta: {
      payment_method: paymentMethod,
      item_count: validatedItems.length,
      total_paise: totals.totalPaise,
    },
  });

  return {
    success: true,
    orderNumber,
    orderId,
    paymentMethod,
    razorpayOrderId,
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
    amountPaise: totals.totalPaise,
  };
}

// ─── Coupon validation action (for checkout preview) ─────────────────────────

export async function validateCouponAction(code: string, subtotalPaise: number) {
  if (!code?.trim()) return { error: 'Enter a coupon code.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Please log in to apply a coupon.' };

  const result = await validateCoupon(supabase, code, user.id, subtotalPaise);
  if ('error' in result) return result;

  return {
    success: true,
    discountPaise: result.discountPaise,
    message: `Coupon "${code.toUpperCase()}" applied! You save ₹${(result.discountPaise / 100).toFixed(2)}.`,
  };
}

// ─── Cancel order action ──────────────────────────────────────────────────────

export async function cancelOrderAction(orderId: string) {
  if (!orderId) return { error: 'Order ID is required.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated.' };

  // Load order — verify ownership
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, user_id, order_number')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (orderError || !order) {
    return { error: 'Order not found.' };
  }

  // Only allow cancellation of pending/confirmed/processing
  const cancellable = ['pending_payment', 'confirmed', 'processing'];
  if (!cancellable.includes(order.status)) {
    return {
      error: `This order cannot be cancelled as it is already "${order.status}".`,
    };
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) {
    return { error: 'Failed to cancel order. Please try again.' };
  }

  // Log timeline event
  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: 'order_cancelled',
    actor_id: user.id,
    actor_role: 'customer',
    meta: { reason: 'Customer requested cancellation' },
  });

  return { success: true, orderNumber: order.order_number };
}
