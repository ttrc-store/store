import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number().int().positive().max(99),
  snapshotName: z.string(),
  snapshotPricePaise: z.number().int().positive(),
  snapshotImageUrl: z.string().url().nullable(),
  stockQty: z.number().int().nonnegative(),
});

export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  sessionId: z.string().nullable(),
  items: z.array(CartItemSchema),
  couponCode: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Input for adding an item to cart */
export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive().max(99).default(1),
});

/** Input for applying a coupon */
export const ApplyCouponSchema = z.object({
  cartId: z.string().uuid(),
  couponCode: z.string().min(1).max(50).toUpperCase(),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;
