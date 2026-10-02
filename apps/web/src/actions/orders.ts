'use server';

import { connectToDatabase } from '@/lib/mongodb/client';
import { OrderModel, ProductModel, UserModel } from '@/lib/mongodb/models';
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

    const order = await OrderModel.findOne({
      _id: orderId,
      user_id: auth.user.id,
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
      revenueData,
      pendingCount,
      lowStockCount,
      outOfStockCount,
      totalProducts,
      totalCustomers,
      recentOrders,
    ] = await Promise.all([
      OrderModel.countDocuments({ created_at: { $gte: todayStart }, status: { $ne: 'cancelled' } }),
      OrderModel.find({ status: { $ne: 'cancelled' } }, 'total').lean(),
      OrderModel.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      ProductModel.countDocuments({ stock_quantity: { $gt: 0, $lte: 5 }, is_active: true }),
      ProductModel.countDocuments({ stock_quantity: 0, is_active: true }),
      ProductModel.countDocuments({ is_active: true }),
      UserModel.countDocuments({ role: 'customer' }),
      OrderModel.find().sort({ created_at: -1 }).limit(5).lean(),
    ]);

    const totalRevenuePaise = revenueData.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      ordersToday,
      totalRevenuePaise,
      pendingCount,
      lowStockCount,
      outOfStockCount,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrders.map((o) => ({
        id: o._id.toString(),
        order_number: o.order_number,
        status: o.status,
        payment_method: o.payment_method,
        total_paise: o.total,
        created_at: o.created_at.toISOString(),
      })),
      topProducts: [] as Array<{ name: string; sku: string; total_qty: number; price: number }>,
    };
  } catch (err) {
    console.error('[Admin Dashboard Metrics Error]', err);
    return {
      ordersToday: 0,
      totalRevenuePaise: 0,
      pendingCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalProducts: 0,
      totalCustomers: 0,
      recentOrders: [],
      topProducts: [] as Array<{ name: string; sku: string; total_qty: number; price: number }>,
    };
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

export async function requestReturnAction(input: {
  orderId: string;
  orderItemId: string;
  quantity: number;
  reason: string;
}) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const order = await OrderModel.findOne({
      _id: input.orderId,
      user_id: auth.user.id,
    });

    if (!order) return { error: 'Order not found.' };

    order.status = 'refunded';
    await order.save();

    revalidatePath(`/account/orders`);
    return { success: true, returnId: `${input.orderId}-return` };
  } catch {
    return { error: 'Failed to submit return request.' };
  }
}
