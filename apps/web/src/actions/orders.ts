'use server';

import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, ProductModel, UserModel, AuditLogModel, CouponModel } from '@/lib/mongodb/models';
import { requireAdmin, requireAuth } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderListItem {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  total_paise: number;
  coupon_code?: string;
  coupon_discount_paise?: number;
  shipping_paise?: number;
  created_at: string;
  order_items?: Array<{
    productId?: string;
    name: string;
    quantity: number;
    pricePaise?: number;
  }>;
  customer?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface OrderDetail extends OrderListItem {
  shipping_address_snap: Record<string, any>;
  subtotal_paise: number;
  discount_paise: number;
  taxable_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  total_gst_paise: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  invoice_number?: string;
  admin_note?: string;
  customer_note?: string;
  items: Array<{
    id: string;
    snapshot_name: string;
    snapshot_sku: string;
    snapshot_image_url?: string;
    quantity: number;
    unit_price_paise: number;
    gst_percent: number;
    hsn_code?: string;
  }>;
  events: Array<{
    id: string;
    event_type: string;
    actor_role?: string;
    meta?: Record<string, any>;
    created_at: string;
  }>;
  shipments: Array<{
    id: string;
    provider: string;
    tracking_number?: string;
    tracking_url?: string;
    estimated_delivery?: string;
  }>;
}

// ─── Customer: List own orders ─────────────────────────────────────────────────

export async function getMyOrdersAction(
  page = 1,
  limit = 10
): Promise<{
  orders?: OrderListItem[];
  total?: number;
  error?: string;
}> {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const skip = (page - 1) * limit;
    const [orders, count] = await Promise.all([
      OrderModel.find({ user_id: auth.user.id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ user_id: auth.user.id }),
    ]);

    const formattedOrders: OrderListItem[] = orders.map((o) => ({
      id: o._id.toString(),
      order_number: o.order_number,
      status: o.status,
      payment_method: o.payment_method,
      total_paise: o.total,
      shipping_paise: o.shipping_total,
      order_items: (o.items || []).map((it: any) => ({
        productId: it.product_id,
        name: it.product_name || 'Robotics Component',
        quantity: it.quantity,
        pricePaise: it.unit_price,
      })),
      created_at: o.created_at.toISOString(),
    }));

    return { orders: formattedOrders, total: count };
  } catch {
    return { error: 'Failed to load orders.' };
  }
}

// ─── Customer: Get single order ─────────────────────────────────────────────

export async function getMyOrderAction(orderId: string): Promise<{
  order?: OrderDetail;
  error?: string;
}> {
  if (!orderId) return { error: 'Order ID is required.' };

  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);

    const order = await OrderModel.findOne({
      $and: [
        {
          $or: [
            ...(isObjectId ? [{ _id: orderId }] : []),
            { order_number: orderId },
          ],
        },
        { user_id: auth.user.id },
      ],
    }).lean();

    if (!order) return { error: 'Order not found.' };

    const formattedDetail: OrderDetail = {
      id: order._id.toString(),
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
      total_paise: order.total,
      subtotal_paise: order.subtotal,
      discount_paise: order.discount_total,
      taxable_paise: order.subtotal - order.discount_total,
      cgst_paise: Math.round(order.tax_total / 2),
      sgst_paise: Math.round(order.tax_total / 2),
      igst_paise: 0,
      total_gst_paise: order.tax_total,
      shipping_address_snap: order.shipping_address,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      created_at: order.created_at.toISOString(),
      items: order.items.map((item, idx) => ({
        id: `${order._id.toString()}-${idx}`,
        snapshot_name: item.product_name,
        snapshot_sku: item.sku,
        snapshot_image_url: item.image_url,
        quantity: item.quantity,
        unit_price_paise: item.unit_price,
        gst_percent: item.gst_percent,
        hsn_code: item.hsn_code,
      })),
      events: [
        {
          id: `${order._id.toString()}-event-1`,
          event_type: `order_${order.status}`,
          actor_role: 'system',
          created_at: order.created_at.toISOString(),
        },
      ],
      shipments: order.tracking_number
        ? [
            {
              id: `${order._id.toString()}-shipment-1`,
              provider: 'manual',
              tracking_number: order.tracking_number,
              tracking_url: order.tracking_url,
            },
          ]
        : [],
    };

    return { order: formattedDetail };
  } catch {
    return { error: 'Order not found.' };
  }
}

// ─── Guest: Get single order by order number + email / phone ───────────────

export async function getGuestOrderAction(
  orderIdentifier: string,
  guestContact: string
): Promise<{
  order?: OrderDetail;
  error?: string;
}> {
  if (!orderIdentifier?.trim() || !guestContact?.trim()) {
    return { error: 'Order number and email/phone are required.' };
  }

  try {
    await connectToDatabase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderIdentifier.trim());
    const cleanContact = guestContact.trim().toLowerCase();
    const cleanPhoneDigits = guestContact.replace(/\D/g, '');

    const order = await OrderModel.findOne({
      $and: [
        {
          $or: [
            ...(isObjectId ? [{ _id: orderIdentifier.trim() }] : []),
            { order_number: orderIdentifier.trim() },
          ],
        },
        {
          $or: [
            { guest_email: cleanContact },
            ...(cleanPhoneDigits.length >= 10
              ? [{ 'shipping_address.phone': { $regex: cleanPhoneDigits } }]
              : []),
          ],
        },
      ],
    }).lean();

    if (!order) return { error: 'Order not found. Please verify your order number and email/phone.' };

    const formattedDetail: OrderDetail = {
      id: order._id.toString(),
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
      total_paise: order.total,
      subtotal_paise: order.subtotal,
      discount_paise: order.discount_total,
      taxable_paise: order.subtotal - order.discount_total,
      cgst_paise: Math.round(order.tax_total / 2),
      sgst_paise: Math.round(order.tax_total / 2),
      igst_paise: 0,
      total_gst_paise: order.tax_total,
      shipping_address_snap: order.shipping_address,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      created_at: order.created_at.toISOString(),
      items: order.items.map((item, idx) => ({
        id: `${order._id.toString()}-${idx}`,
        snapshot_name: item.product_name,
        snapshot_sku: item.sku,
        snapshot_image_url: item.image_url,
        quantity: item.quantity,
        unit_price_paise: item.unit_price,
        gst_percent: item.gst_percent,
        hsn_code: item.hsn_code,
      })),
      events: [
        {
          id: `${order._id.toString()}-event-1`,
          event_type: `order_${order.status}`,
          actor_role: 'system',
          created_at: order.created_at.toISOString(),
        },
      ],
      shipments: order.tracking_number
        ? [
            {
              id: `${order._id.toString()}-shipment-1`,
              provider: 'manual',
              tracking_number: order.tracking_number,
              tracking_url: order.tracking_url,
            },
          ]
        : [],
    };

    return { order: formattedDetail };
  } catch {
    return { error: 'Order not found.' };
  }
}

// ─── Admin: List all orders ───────────────────────────────────────────────────

export async function getAdminOrdersAction(opts?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{
  orders?: OrderListItem[];
  total?: number;
  error?: string;
}> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 50;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (opts?.status && opts.status !== 'all') {
      query.status = opts.status;
    }
    if (opts?.search) {
      query.order_number = { $regex: opts.search, $options: 'i' };
    }

    const [orders, count] = await Promise.all([
      OrderModel.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(query),
    ]);

    const formattedOrders: OrderListItem[] = orders.map((o) => ({
      id: o._id.toString(),
      order_number: o.order_number,
      status: o.status,
      payment_method: o.payment_method,
      total_paise: o.total,
      created_at: o.created_at.toISOString(),
    }));

    return { orders: formattedOrders, total: count };
  } catch {
    return { error: 'Failed to load orders.' };
  }
}

// ─── Admin Dashboard Metrics ──────────────────────────────────────────────────

export async function getAdminDashboardMetricsAction() {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      ordersToday,
      paidOrders,
      refundedOrders,
      pendingOrdersCount,
      processingOrdersCount,
      shippedOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      refundedOrdersCount,
      failedPaymentOrdersCount,
      pendingPaymentOrdersCount,
      publishedProductsCount,
      draftProductsCount,
      archivedProductsCount,
      lowStockCount,
      outOfStockCount,
      totalCustomers,
      recentOrders,
      topProductsAgg,
      recentActivityLogs,
    ] = await Promise.all([
      // Orders created today
      OrderModel.countDocuments({ created_at: { $gte: todayStart } }),
      // Orders with VERIFIED PAYMENT (the only source of real paid revenue)
      OrderModel.find({ payment_status: 'paid' }, 'total subtotal tax_total shipping_total discount_total').lean(),
      // Orders that have been refunded
      OrderModel.find({ payment_status: 'refunded' }, 'total').lean(),
      // Order status breakdown
      OrderModel.countDocuments({ status: 'pending' }),
      OrderModel.countDocuments({ status: 'processing' }),
      OrderModel.countDocuments({ status: 'shipped' }),
      OrderModel.countDocuments({ status: 'delivered' }),
      OrderModel.countDocuments({ status: 'cancelled' }),
      OrderModel.countDocuments({ status: 'refunded' }),
      // Payment status breakdown
      OrderModel.countDocuments({ payment_status: 'failed' }),
      OrderModel.countDocuments({ payment_status: 'pending' }),
      // Catalog status breakdown
      ProductModel.countDocuments({ status: 'published', is_active: true }),
      ProductModel.countDocuments({ status: 'draft' }),
      ProductModel.countDocuments({ status: 'archived' }),
      ProductModel.countDocuments({ stock_quantity: { $gt: 0, $lte: 5 }, is_active: true }),
      ProductModel.countDocuments({ stock_quantity: 0, is_active: true }),
      UserModel.countDocuments({ role: 'customer' }),
      OrderModel.find().sort({ created_at: -1 }).limit(8).lean(),
      // Real Top Selling Products from verified completed sales
      OrderModel.aggregate([
        { $match: { payment_status: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product_id',
            name: { $first: '$items.product_name' },
            sku: { $first: '$items.sku' },
            total_qty: { $sum: '$items.quantity' },
            price: { $first: '$items.unit_price' },
          },
        },
        { $sort: { total_qty: -1 } },
        { $limit: 5 },
      ]),
      // Recent Administrative Activity
      AuditLogModel.find().sort({ created_at: -1 }).limit(6).lean(),
    ]);

    const paidRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const refundedPaise = refundedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const netRevenuePaise = Math.max(0, paidRevenuePaise - refundedPaise);

    return {
      ordersToday,
      totalRevenuePaise: paidRevenuePaise, // STRICT: only verified paid revenue
      paidRevenuePaise,
      refundedPaise,
      netRevenuePaise,
      paidOrdersCount: paidOrders.length,
      pendingCount: pendingOrdersCount + processingOrdersCount,
      pendingOrdersCount,
      processingOrdersCount,
      shippedOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      refundedOrdersCount,
      failedPaymentOrdersCount,
      pendingPaymentOrdersCount,
      publishedProductsCount,
      draftProductsCount,
      archivedProductsCount,
      totalProducts: publishedProductsCount + draftProductsCount + archivedProductsCount,
      lowStockCount,
      outOfStockCount,
      totalCustomers,
      recentOrders: recentOrders.map((o) => ({
        id: o._id.toString(),
        order_number: o.order_number,
        status: o.status,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        total_paise: o.total,
        created_at: o.created_at.toISOString(),
      })),
      topProducts: topProductsAgg.map((p) => ({
        name: p.name || 'Unnamed Component',
        sku: p.sku || 'SKU-N/A',
        total_qty: p.total_qty || 0,
        price: p.price || 0,
      })),
      recentActivity: recentActivityLogs.map((log) => ({
        id: log._id.toString(),
        actor_id: log.actor_id,
        action: log.action,
        entity: log.entity,
        entity_id: log.entity_id,
        metadata: log.metadata,
        created_at: log.created_at.toISOString(),
      })),
    };
  } catch (err) {
    console.error('[Admin Dashboard Metrics Error]', err);
    return {
      ordersToday: 0,
      totalRevenuePaise: 0,
      paidRevenuePaise: 0,
      refundedPaise: 0,
      netRevenuePaise: 0,
      paidOrdersCount: 0,
      pendingCount: 0,
      pendingOrdersCount: 0,
      processingOrdersCount: 0,
      shippedOrdersCount: 0,
      deliveredOrdersCount: 0,
      cancelledOrdersCount: 0,
      refundedOrdersCount: 0,
      failedPaymentOrdersCount: 0,
      pendingPaymentOrdersCount: 0,
      publishedProductsCount: 0,
      draftProductsCount: 0,
      archivedProductsCount: 0,
      totalProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalCustomers: 0,
      recentOrders: [],
      topProducts: [],
      recentActivity: [],
    };
  }
}

// ─── Admin Single Order Detail ────────────────────────────────────────────────

export async function getAdminOrderDetailAction(orderId: string): Promise<{
  order?: {
    id: string;
    order_number: string;
    bill_number?: string;
    status: string;
    payment_status: string;
    payment_method: string;
    subtotal_paise: number;
    discount_paise: number;
    tax_total_paise: number;
    shipping_total_paise: number;
    total_paise: number;
    shipping_address: Record<string, any>;
    billing_address: Record<string, any>;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    tracking_number?: string;
    tracking_url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    customer?: {
      id?: string;
      email?: string;
      full_name?: string;
      phone?: string;
    };
    items: Array<{
      product_id: string;
      product_name: string;
      sku: string;
      unit_price: number;
      mrp_price?: number;
      bulk_tier_applied?: string;
      quantity: number;
      total_price: number;
      gst_percent: number;
      hsn_code: string;
      is_spare_part: boolean;
      image_url?: string;
    }>;
    auditLogs: Array<{
      id: string;
      action: string;
      actor_id: string;
      created_at: string;
      metadata?: any;
    }>;
  };
  error?: string;
}> {
  if (!orderId) return { error: 'Order ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const order = await OrderModel.findOne({
      $or: [{ _id: orderId }, { order_number: orderId }],
    }).lean();

    if (!order) return { error: 'Order not found' };

    let customerInfo: any = null;
    if (order.user_id) {
      const userDoc = await UserModel.findById(order.user_id).lean();
      if (userDoc) {
        customerInfo = {
          id: userDoc._id.toString(),
          email: userDoc.email,
          full_name: userDoc.full_name,
          phone: userDoc.phone,
        };
      }
    }

    if (!customerInfo && order.guest_email) {
      customerInfo = {
        email: order.guest_email,
        full_name: order.shipping_address?.fullName || 'Guest Customer',
        phone: order.shipping_address?.phone || '',
      };
    }

    // Load audit logs relevant to this order
    const relevantEntityIds = [order._id.toString(), order.order_number, order.razorpay_order_id].filter(
      (id): id is string => Boolean(id)
    );
    const auditLogs = await AuditLogModel.find({
      entity: { $in: ['order', 'payment'] },
      entity_id: { $in: relevantEntityIds },
    })
      .sort({ created_at: -1 })
      .lean();

    return {
      order: {
        id: order._id.toString(),
        order_number: order.order_number,
        bill_number: order.bill_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        subtotal_paise: order.subtotal,
        discount_paise: order.discount_total,
        tax_total_paise: order.tax_total,
        shipping_total_paise: order.shipping_total,
        total_paise: order.total,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        razorpay_signature: order.razorpay_signature,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        notes: order.notes,
        created_at: order.created_at.toISOString(),
        updated_at: order.updated_at.toISOString(),
        customer: customerInfo,
        items: order.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          unit_price: item.unit_price,
          mrp_price: item.mrp_price,
          bulk_tier_applied: item.bulk_tier_applied,
          quantity: item.quantity,
          total_price: item.total_price,
          gst_percent: item.gst_percent,
          hsn_code: item.hsn_code,
          is_spare_part: item.is_spare_part,
          image_url: item.image_url,
        })),
        auditLogs: auditLogs.map((log) => ({
          id: log._id.toString(),
          action: log.action,
          actor_id: log.actor_id,
          created_at: log.created_at.toISOString(),
          metadata: log.metadata,
        })),
      },
    };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch order detail' };
  }
}

// ─── Admin Analytics Report Action ───────────────────────────────────────────

export async function getAdminAnalyticsReportAction(period: 'today' | '7d' | '30d' | 'ytd' | 'all' = '30d') {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const now = new Date();
    let startDate: Date | null = new Date();

    if (period === 'today') {
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = null; // all time
    }

    const dateFilter = startDate ? { created_at: { $gte: startDate } } : {};

    const [
      allOrdersInPeriod,
      paidOrdersInPeriod,
      refundedOrdersInPeriod,
      newCustomersCount,
      couponsUsedAgg,
      stockMovementLogs,
    ] = await Promise.all([
      OrderModel.find(dateFilter, 'status payment_status total created_at').lean(),
      OrderModel.find({ ...dateFilter, payment_status: 'paid' }, 'total subtotal tax_total shipping_total created_at').lean(),
      OrderModel.find({ ...dateFilter, payment_status: 'refunded' }, 'total').lean(),
      UserModel.countDocuments({ ...dateFilter, role: 'customer' }),
      OrderModel.aggregate([
        { $match: { ...dateFilter, discount_total: { $gt: 0 } } },
        { $group: { _id: null, totalDiscount: { $sum: '$discount_total' }, count: { $sum: 1 } } },
      ]),
      AuditLogModel.find({ ...dateFilter, action: 'inventory.adjusted' })
        .sort({ created_at: -1 })
        .limit(20)
        .lean(),
    ]);

    const grossPaidRevenuePaise = paidOrdersInPeriod.reduce((sum, o) => sum + (o.total || 0), 0);
    const refundTotalPaise = refundedOrdersInPeriod.reduce((sum, o) => sum + (o.total || 0), 0);
    const netRevenuePaise = Math.max(0, grossPaidRevenuePaise - refundTotalPaise);
    const paidOrdersCount = paidOrdersInPeriod.length;
    const averageOrderValuePaise = paidOrdersCount > 0 ? Math.round(grossPaidRevenuePaise / paidOrdersCount) : 0;

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const ord of allOrdersInPeriod) {
      statusCounts[ord.status] = (statusCounts[ord.status] || 0) + 1;
    }

    return {
      period,
      startDate: startDate?.toISOString() || null,
      endDate: now.toISOString(),
      summary: {
        grossPaidRevenuePaise,
        refundTotalPaise,
        netRevenuePaise,
        paidOrdersCount,
        averageOrderValuePaise,
        totalOrdersPlaced: allOrdersInPeriod.length,
        newCustomersCount,
        discountGivenPaise: couponsUsedAgg[0]?.totalDiscount || 0,
        ordersWithDiscountCount: couponsUsedAgg[0]?.count || 0,
      },
      statusDistribution: statusCounts,
      inventoryMovements: stockMovementLogs.map((log) => ({
        id: log._id.toString(),
        productId: log.entity_id,
        actor: log.actor_id,
        created_at: log.created_at.toISOString(),
        metadata: log.metadata,
      })),
    };
  } catch (err: any) {
    console.error('[Admin Analytics Report Error]', err);
    return { error: err.message || 'Failed to generate analytics report' };
  }
}

// ─── Admin Products ─────────────────────────────────────────────────────────

export async function getAdminProductsAction(opts?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  type?: string;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 50;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (opts?.type && opts.type !== 'all') {
      query.product_type = opts.type;
    }
    if (opts?.status && opts.status !== 'all') {
      query.status = opts.status;
    }
    if (opts?.search) {
      query.$or = [
        { name: { $regex: opts.search, $options: 'i' } },
        { sku: { $regex: opts.search, $options: 'i' } },
        { slug: { $regex: opts.search, $options: 'i' } },
      ];
    }

    const [products, count] = await Promise.all([
      ProductModel.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(query),
    ]);

    return {
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        unit: p.unit || 'Piece',
        type: p.product_type,
        status: p.status || (p.is_active ? 'published' : 'archived'),
        price_paise: p.price,
        mrp_paise: p.compare_at_price ?? null,
        bulk_price_tiers: p.bulk_price_tiers || [],
        gst_percent: p.gst_percent,
        stock_qty: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        category_id: p.category_id,
        brand: p.brand || 'Tamizh Tech',
        manufacturer: p.manufacturer_id,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
        imageUrls: p.images || [],
      })),
      total: count,
    };
  } catch {
    return { error: 'Failed to load products.' };
  }
}

// ─── Admin Customers ─────────────────────────────────────────────────────────

export async function getAdminCustomersAction(opts?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 50;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { role: 'customer' };
    if (opts?.search) {
      query.$or = [
        { full_name: { $regex: opts.search, $options: 'i' } },
        { email: { $regex: opts.search, $options: 'i' } },
      ];
    }

    const [customers, count] = await Promise.all([
      UserModel.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(query),
    ]);

    return {
      customers: customers.map((c) => ({
        id: c._id.toString(),
        full_name: c.full_name,
        email: c.email,
        phone: c.phone,
        created_at: c.created_at.toISOString(),
        user_roles: [{ role: c.role }],
      })),
      total: count,
    };
  } catch {
    return { error: 'Failed to load customers.' };
  }
}

export async function cancelMyOrderAction(input: {
  orderId: string;
  reason?: string;
}): Promise<{ success?: boolean; message?: string; error?: string }> {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const order = await OrderModel.findOne({
      _id: input.orderId,
      user_id: auth.user.id,
    });

    if (!order) return { error: 'Order not found or access denied.' };

    const cancellableStatuses = ['confirmed', 'processing', 'pending_payment'];
    if (!cancellableStatuses.includes(order.status)) {
      return {
        error: `Order cannot be cancelled because it is already ${order.status.replace(/_/g, ' ')}. Please contact support@ttrc.store.`,
      };
    }

    // 1. Restore product inventory
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.product_id && item.quantity > 0) {
          await ProductModel.updateOne(
            { _id: item.product_id },
            { $inc: { stock_quantity: item.quantity } }
          );
        }
      }
    }

    // 2. Mark order as cancelled
    const previousStatus = order.status;
    order.status = 'cancelled';
    const reasonText = input.reason?.trim() || 'Customer requested order cancellation';
    order.notes = order.notes
      ? `${order.notes} | Cancellation: ${reasonText}`
      : `Cancellation: ${reasonText}`;

    await order.save();

    // 3. Record audit trail
    await AuditLogModel.create({
      action: 'order.cancelled_by_customer',
      entity: 'order',
      entity_id: order._id.toString(),
      actor_id: auth.user.id,
      metadata: {
        order_number: order.order_number,
        previous_status: previousStatus,
        reason: reasonText,
        actor_email: auth.user.email,
        actor_role: 'customer',
      },
    });

    revalidatePath('/account');
    revalidatePath('/account/orders');
    revalidatePath(`/orders/${order._id.toString()}`);

    return {
      success: true,
      message: 'Your order has been cancelled successfully and reserved inventory has been released.',
    };
  } catch (err: any) {
    console.error('[Cancel My Order Error]', err);
    return { error: 'Failed to cancel order. Please try again or contact support.' };
  }
}

export async function requestReturnAction(input: {
  orderId: string;
  orderItemId?: string;
  quantity?: number;
  reason: string;
}): Promise<{ success?: boolean; message?: string; error?: string; returnId?: string }> {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  if (!input.reason?.trim()) {
    return { error: 'Please provide a reason for the return / replacement request.' };
  }

  try {
    await connectToDatabase();

    const order = await OrderModel.findOne({
      _id: input.orderId,
      user_id: auth.user.id,
    });

    if (!order) return { error: 'Order not found or access denied.' };

    if (order.status !== 'delivered') {
      return { error: 'Return requests can only be submitted for delivered orders.' };
    }

    // Check delivery 7-day window
    const deliveredDate = order.updated_at || order.created_at;
    const diffDays = (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return {
        error:
          'This order is outside the 7-day replacement window. For warranty support on defective parts, please contact support@ttrc.store.',
      };
    }

    const existingNotes = order.notes || '';
    order.notes = existingNotes
      ? `${existingNotes} | Return request: ${input.reason.trim()}`
      : `Return request: ${input.reason.trim()}`;
    await order.save();

    await AuditLogModel.create({
      action: 'order.return_requested_by_customer',
      entity: 'order',
      entity_id: order._id.toString(),
      actor_id: auth.user.id,
      metadata: {
        order_number: order.order_number,
        reason: input.reason.trim(),
        actor_email: auth.user.email,
        actor_role: 'customer',
      },
    });

    revalidatePath('/account');
    revalidatePath('/account/orders');
    revalidatePath(`/orders/${order._id.toString()}`);

    return {
      success: true,
      message: 'Return / replacement request submitted. Our support team will inspect and review within 24-48 hours.',
      returnId: `${input.orderId}-return`,
    };
  } catch (err: any) {
    console.error('[Request Return Error]', err);
    return { error: 'Failed to submit return request.' };
  }
}
