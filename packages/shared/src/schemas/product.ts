import { z } from 'zod';

export const ProductTypeSchema = z.enum(['kit', 'spare_part', 'general']);
export const ProductStatusSchema = z.enum(['draft', 'published', 'archived']);

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  url: z.string().url(),
  alt: z.string().max(255),
  sortOrder: z.number().int().nonnegative(),
});

export const ProductSpecSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
  sortOrder: z.number().int().nonnegative(),
});

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  pricePaise: z.number().int().positive('Price must be a positive integer in paise'),
  mrpPaise: z.number().int().positive().nullable(),
  stockQty: z.number().int().nonnegative(),
  images: z.array(z.string().url()),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  sku: z.string().min(1).max(100),
  type: ProductTypeSchema,
  brand: z.string().max(255).nullable(),
  categoryId: z.string().uuid(),
  shortDescription: z.string().max(500),
  longDescription: z.string().nullable(),
  pricePaise: z.number().int().positive(),
  mrpPaise: z.number().int().positive().nullable(),
  gstPercent: z.union([z.literal(0), z.literal(5), z.literal(12), z.literal(18), z.literal(28)]),
  hsnCode: z.string().max(20).nullable(),
  stockQty: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  weightGrams: z.number().int().positive().nullable(),
  lengthMm: z.number().int().positive().nullable(),
  widthMm: z.number().int().positive().nullable(),
  heightMm: z.number().int().positive().nullable(),
  tags: z.array(z.string()).default([]),
  status: ProductStatusSchema.default('draft'),
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(160).nullable(),
  seoKeywords: z.array(z.string()).default([]),
});

/** For create/edit forms — omits id, uses input shape */
export const CreateProductSchema = ProductSchema.omit({ id: true }).extend({
  images: z.array(z.string().url()).optional(),
  specs: z.array(ProductSpecSchema.omit({ id: true, productId: true })).optional(),
  variants: z.array(ProductVariantSchema.omit({ id: true, productId: true })).optional(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().nullable(),
  icon: z.string().nullable(),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

export type ProductTypeInput = z.infer<typeof ProductTypeSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
