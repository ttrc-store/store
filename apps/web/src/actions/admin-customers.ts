'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb/client';
import { UserModel, OrderModel, IUserAddress } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';
import { getNextSequenceId } from '@/lib/id-generator';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface AdminCustomerSummary {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'staff';
  joinedDate: string;
  addressesCount: number;
  ordersCount: number;
  totalSpentPaise: number;
}

export interface AdminCustomerOrderSummary {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_paise: number;
  items_count: number;
  items_summary: string;
}

export interface AdminCustomerDetails {
  id: string;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  addresses: IUserAddress[];
  stats: {
    total_orders: number;
    total_spent_paise: number;
    avg_order_value_paise: number;
  };
  recent_orders: AdminCustomerOrderSummary[];
}

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const CreateCustomerSchema = z.object({
  full_name: z.string().min(2, 'Customer name is required').max(100),
  email: z.string().email('Valid email address is required').toLowerCase(),
  phone: z
    .string()
    .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  address: z
    .object({
      line1: z.string().min(3, 'Address line 1 is required'),
      line2: z.string().optional(),
      city: z.string().min(2, 'City is required'),
      state: z.string().min(2, 'State is required'),
      pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    })
    .optional(),
});

const UpdateCustomerSchema = z.object({
  full_name: z.string().min(2, 'Customer name is required').max(100),
  email: z.string().email('Valid email address is required').toLowerCase(),
  phone: z
    .string()
    .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal('')),
});

// ─── SERVER ACTIONS ──────────────────────────────────────────────────────────

/**
 * List registered customers with order aggregate statistics
 */
export async function getAdminCustomersAction(options: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();
    const { search = '', page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      role: 'customer',
    };

    if (search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { full_name: regex },
        { email: regex },
        { phone: regex },
        { customer_id: regex },
      ];
    }

    const [users, count] = await Promise.all([
      UserModel.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    // Fetch order metrics for returned customers in parallel
    const userIds = users.map((u) => u._id.toString());
    const ordersByUser = await OrderModel.aggregate([
      { $match: { user_id: { $in: userIds }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$user_id',
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const orderStatsMap = new Map(
      ordersByUser.map((o) => [o._id.toString(), { ordersCount: o.ordersCount, totalSpent: o.totalSpent }])
    );

    const customers: AdminCustomerSummary[] = users.map((u) => {
      const stats = orderStatsMap.get(u._id.toString()) || { ordersCount: 0, totalSpent: 0 };
      return {
        id: u._id.toString(),
        customer_id: u.customer_id || `TTRC-CUS-00001`,
        name: u.full_name,
        email: u.email,
        phone: u.phone || '—',
        role: u.role,
        joinedDate: new Date(u.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        addressesCount: Array.isArray(u.addresses) ? u.addresses.length : 0,
        ordersCount: stats.ordersCount,
        totalSpentPaise: stats.totalSpent,
      };
    });

    return { customers, total: count };
  } catch (err: any) {
    console.error('[Admin Get Customers Error]', err);
    return { error: 'Failed to load customer directory.' };
  }
}

/**
 * Get full customer details including saved addresses and complete order history
 */
export async function getAdminCustomerDetailsAction(userId: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return { error: 'Customer account not found.' };
    }

    // Fetch all orders placed by this customer
    const orders = await OrderModel.find({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();

    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalSpent = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalSpent / validOrders.length) : 0;

    const recentOrders: AdminCustomerOrderSummary[] = orders.map((o) => {
      const items = o.items || [];
      const itemNames = items.map((i) => i.product_name).slice(0, 2).join(', ');
      const overflow = items.length > 2 ? ` +${items.length - 2} more` : '';

      return {
        id: o._id.toString(),
        order_number: o.order_number,
        created_at: new Date(o.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: o.status,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        total_paise: o.total,
        items_count: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
        items_summary: itemNames ? `${itemNames}${overflow}` : 'Items list',
      };
    });

    const details: AdminCustomerDetails = {
      id: user._id.toString(),
      customer_id: user.customer_id || 'TTRC-CUS-00001',
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '—',
      role: user.role,
      created_at: new Date(user.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      addresses: (user.addresses as IUserAddress[]) || [],
      stats: {
        total_orders: orders.length,
        total_spent_paise: totalSpent,
        avg_order_value_paise: avgOrderValue,
      },
      recent_orders: recentOrders,
    };

    return { customer: details };
  } catch (err: any) {
    console.error('[Admin Customer Details Error]', err);
    return { error: 'Failed to retrieve customer details.' };
  }
}

/**
 * Add a new customer account directly from admin panel
 */
export async function createAdminCustomerAction(rawInput: z.infer<typeof CreateCustomerSchema>) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = CreateCustomerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { full_name, email, phone, password, address } = parsed.data;

  try {
    await connectToDatabase();

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return { error: 'An account with this email address already exists.' };
    }

    const customer_id = await getNextSequenceId('CUS');
    const password_hash = await bcrypt.hash(password, 10);

    const initialAddresses: IUserAddress[] = [];
    if (address && address.line1 && address.city) {
      initialAddresses.push({
        id: `addr_${Date.now()}`,
        fullName: full_name,
        phone: phone || '',
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: true,
      });
    }

    const newCustomer = await UserModel.create({
      customer_id,
      full_name,
      email,
      phone: phone || undefined,
      password_hash,
      role: 'customer',
      addresses: initialAddresses,
    });

    revalidatePath('/admin/customers');

    return {
      success: true,
      customerId: customer_id,
      id: newCustomer._id.toString(),
      message: `Customer ${customer_id} created successfully.`,
    };
  } catch (err: any) {
    console.error('[Admin Create Customer Error]', err);
    return { error: 'Failed to create customer record.' };
  }
}

/**
 * Update an existing customer's basic profile
 */
export async function updateAdminCustomerAction(
  userId: string,
  rawInput: z.infer<typeof UpdateCustomerSchema>
) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = UpdateCustomerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { full_name, email, phone } = parsed.data;

  try {
    await connectToDatabase();

    // Check if email is used by another account
    const existing = await UserModel.findOne({ email, _id: { $ne: userId } });
    if (existing) {
      return { error: 'Another account is already using this email address.' };
    }

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          full_name,
          email,
          phone: phone || undefined,
        },
      },
      { new: true }
    );

    if (!updated) {
      return { error: 'Customer not found.' };
    }

    revalidatePath('/admin/customers');

    return {
      success: true,
      message: 'Customer details updated successfully.',
    };
  } catch (err: any) {
    console.error('[Admin Update Customer Error]', err);
    return { error: 'Failed to update customer profile.' };
  }
}

/**
 * Delete a customer account (safeguarded against deleting admins)
 */
export async function deleteAdminCustomerAction(userId: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const user = await UserModel.findById(userId);
    if (!user) {
      return { error: 'Customer not found.' };
    }

    if (user.role === 'admin') {
      return { error: 'Administrative accounts cannot be deleted from customer management.' };
    }

    await UserModel.findByIdAndDelete(userId);

    revalidatePath('/admin/customers');

    return {
      success: true,
      message: `Customer account deleted successfully.`,
    };
  } catch (err: any) {
    console.error('[Admin Delete Customer Error]', err);
    return { error: 'Failed to delete customer.' };
  }
}
