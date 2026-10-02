'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireAuth } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderListItem {
  id: string;
  order_number: string | null;
  status: string;
  payment_method: string;
  total_paise: number;
  coupon_code: string | null;
  coupon_discount_paise: number;
  shipping_paise: number;
  created_at: string;
  customer?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface OrderDetail extends OrderListItem {
  shipping_address_snap: Record<string, unknown> | null;
  subtotal_paise: number;
  discount_paise: number;
  taxable_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  total_gst_paise: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  invoice_number: string | null;
  admin_note: string | null;
  customer_note: string | null;
  items: Array<{
    id: string;
    snapshot_name: string;
    snapshot_sku: string;
    snapshot_image_url: string | null;
    quantity: number;
    unit_price_paise: number;
    gst_percent: number;
    hsn_code: string | null;
  }>;
  events: Array<{
    id: string;
    event_type: string;
    actor_role: string | null;
    meta: Record<string, unknown> | null;
    created_at: string;
  }>;
  shipments: Array<{
    id: string;
    provider: string;
    tracking_number: string | null;
    tracking_url: string | null;
    estimated_delivery: string | null;
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

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_method, total_paise, coupon_code, coupon_discount_paise, shipping_paise, created_at',
      { count: 'exact' }
    )
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[getMyOrders] error:', error);
    return { error: 'Failed to load orders.' };
  }

  return {
    orders: (data ?? []) as OrderListItem[],
    total: count ?? 0,
  };
}

// ─── Customer: Get single order (ownership verified) ─────────────────────────

export async function getMyOrderAction(orderId: string): Promise<{
  order?: OrderDetail;
  error?: string;
}> {
  if (!orderId) return { error: 'Order ID is required.' };

  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', auth.user.id) // IDOR protection: must own the order
    .single();

  if (orderError || !order) return { error: 'Order not found.' };

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  const { data: events } = await supabase
    .from('order_events')
    .select('id, event_type, actor_role, meta, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  const { data: shipments } = await supabase
    .from('shipments')
    .select('id, provider, tracking_number, tracking_url, estimated_delivery')
    .eq('order_id', orderId);

  return {
    order: {
      ...order,
      items: items ?? [],
      events: events ?? [],
      shipments: shipments ?? [],
    } as OrderDetail,
  };
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

  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select(
      `id, order_number, status, payment_method, total_paise, coupon_code, coupon_discount_paise, shipping_paise, created_at,
       profiles!inner(id, full_name),
       auth_users:user_id(email)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  }

  if (opts?.search) {
    query = query.or(
      `order_number.ilike.%${opts.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[getAdminOrders] error:', error);
    // Fallback: simpler query without joins
    const { data: fallback, count: fallbackCount } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_method, total_paise, coupon_code, coupon_discount_paise, shipping_paise, created_at, user_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      orders: (fallback ?? []) as OrderListItem[],
      total: fallbackCount ?? 0,
    };
  }

  return {
    orders: (data ?? []) as OrderListItem[],
    total: count ?? 0,
  };
}

// ─── Admin: Get single order detail ─────────────────────────────────────────

export async function getAdminOrderAction(orderId: string): Promise<{
  order?: OrderDetail;
  items?: any[];
  events?: any[];
  error?: string;
}> {
  if (!orderId) return { error: 'Order ID is required.' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return { error: 'Order not found.' };

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  const { data: events } = await supabase
    .from('order_events')
    .select('id, event_type, actor_role, meta, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  return {
    order,
    items: items ?? [],
    events: events ?? [],
  };
}

export async function getAdminDashboardMetricsAction() {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    const supabase = await createClient();

    // Today's start (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Orders today
    const { count: ordersToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .not('status', 'in', '(cancelled,payment_failed)');

    // Revenue (all time, confirmed orders)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_paise')
      .not('status', 'in', '(cancelled,payment_failed,pending_payment)');

    const totalRevenuePaise = (revenueData ?? []).reduce(
      (sum, o) => sum + (o.total_paise ?? 0),
      0
    );

    // Pending orders count
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'processing']);

    // Low stock products
    const { count: lowStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lte('stock_qty', 5)
      .gt('stock_qty', 0)
      .eq('status', 'published');

    // Out of stock
    const { count: outOfStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('stock_qty', 0)
      .eq('status', 'published');

    // Total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Total customers
    const { count: totalCustomers } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // Recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_method, total_paise, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    // Top selling products (by order_items quantity)
    const { data: topProducts } = await supabase
      .from('order_items')
      .select('snapshot_name, snapshot_sku, unit_price_paise, quantity, product_id')
      .order('quantity', { ascending: false })
      .limit(10);

    // Aggregate top products
    const productSales = new Map<string, { name: string; sku: string; total_qty: number; price: number }>();

    for (const item of topProducts ?? []) {
      const key = item.product_id ?? item.snapshot_sku;
      const existing = productSales.get(key);
      if (existing) {
        existing.total_qty += item.quantity ?? 0;
      } else {
        productSales.set(key, {
          name: item.snapshot_name,
          sku: item.snapshot_sku,
          total_qty: item.quantity ?? 0,
          price: item.unit_price_paise,
        });
      }
    }
    const topProductsList = Array.from(productSales.values())
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 5);

    return {
      ordersToday: ordersToday ?? 0,
      totalRevenuePaise: totalRevenuePaise ?? 0,
      pendingCount: pendingCount ?? 0,
      lowStockCount: lowStockCount ?? 0,
      outOfStockCount: outOfStockCount ?? 0,
      totalProducts: totalProducts ?? 0,
      totalCustomers: totalCustomers ?? 0,
      recentOrders: recentOrders ?? [],
      topProducts: topProductsList,
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
      topProducts: [],
    };
  }
}

// ─── Admin: Get products list ─────────────────────────────────────────────────

export async function getAdminProductsAction(opts?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  type?: string;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select(
      `id, name, slug, sku, type, status, price_paise, mrp_paise, gst_percent, stock_qty, 
       low_stock_threshold, category_id, brand, created_at, updated_at,
       product_images(url, sort_order)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  } else {
    query = query.neq('status', 'archived');
  }

  if (opts?.type && opts.type !== 'all') {
    query = query.eq('type', opts.type);
  }

  if (opts?.search) {
    query = query.or(
      `name.ilike.%${opts.search}%,sku.ilike.%${opts.search}%,slug.ilike.%${opts.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[getAdminProducts] error:', error);
    return { error: 'Failed to load products.' };
  }

  return {
    products: (data ?? []).map((p) => ({
      ...p,
      imageUrls: ((p.product_images ?? []) as Array<{ url: string; sort_order: number }>)
        .filter((img) => img.sort_order < 999)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => img.url),
    })),
    total: count ?? 0,
  };
}

// ─── Admin: Get customers list ─────────────────────────────────────────────────

export async function getAdminCustomersAction(opts?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('profiles')
    .select(
      `id, full_name, phone, created_at,
       user_roles(role)`,
      { count: 'exact' }
    )
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAdminCustomers] error:', error);
    return { error: 'Failed to load customers.' };
  }

  return {
    customers: data ?? [],
    total: count ?? 0,
  };
}

// ─── Return request action (customer) ────────────────────────────────────────

export async function requestReturnAction(input: {
  orderId: string;
  orderItemId: string;
  quantity: number;
  reason: string;
}) {
  const auth = await requireAuth();
  if ('error' in auth) return { error: auth.error };

  const supabase = await createClient();

  // Verify order ownership
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, created_at')
    .eq('id', input.orderId)
    .eq('user_id', auth.user.id)
    .single();

  if (!order) return { error: 'Order not found.' };
  if (order.status !== 'delivered') {
    return { error: 'Returns can only be requested for delivered orders.' };
  }

  // Check return window (default 7 days)
  const deliveredAt = new Date(order.created_at);
  const returnWindowDays = 7; // from site_settings ideally
  const windowEnd = new Date(deliveredAt);
  windowEnd.setDate(windowEnd.getDate() + returnWindowDays);
  if (new Date() > windowEnd) {
    return { error: `Return window of ${returnWindowDays} days has expired.` };
  }

  const { data, error } = await supabase
    .from('returns')
    .insert({
      order_id: input.orderId,
      order_item_id: input.orderItemId,
      user_id: auth.user.id,
      quantity: input.quantity,
      reason: input.reason,
      status: 'requested',
    })
    .select('id')
    .single();

  if (error) return { error: 'Failed to submit return request.' };

  await supabase.from('order_events').insert({
    order_id: input.orderId,
    event_type: 'return_requested',
    actor_id: auth.user.id,
    actor_role: 'customer',
    meta: { return_id: data.id, reason: input.reason },
  });

  revalidatePath(`/account/orders`);
  return { success: true, returnId: data.id };
}
