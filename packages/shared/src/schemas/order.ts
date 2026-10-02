import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'pending_payment',
  'payment_failed',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
]);

export const GSTBreakdownSchema = z.object({
  taxableAmountPaise: z.number().int().nonnegative(),
  cgstPaise: z.number().int().nonnegative(),
  sgstPaise: z.number().int().nonnegative(),
  igstPaise: z.number().int().nonnegative(),
  totalGstPaise: z.number().int().nonnegative(),
});

export const CreateOrderSchema = z.object({
  cartId: z.string().uuid(),
  shippingAddressId: z.string().uuid(),
  paymentMethod: z.enum(['razorpay', 'cod']),
  couponCode: z.string().optional(),
  // Client MUST NOT send amounts — server computes everything
});

export const AddressSchema = z.object({
  label: z.string().max(50).nullable().optional(),
  fullName: z.string().min(2).max(255),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Must be a valid Indian mobile number (+91XXXXXXXXXX)'),
  line1: z.string().min(5).max(255),
  line2: z.string().max(255).nullable().optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit Indian pincode'),
  isDefault: z.boolean().default(false),
});

export type OrderStatusInput = z.infer<typeof OrderStatusSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
