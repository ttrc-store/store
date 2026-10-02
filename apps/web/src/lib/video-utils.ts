import { z } from 'zod';

export function sanitizeVideoEmbedUrl(url?: string): string | undefined {
  if (!url || !url.trim()) return undefined;
  const cleanUrl = url.trim();

  // YouTube matchers
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }

  // Vimeo matchers
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return undefined;
}

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Product title must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  sku: z.string().optional(),
  productType: z.enum(['kit', 'spare_part', 'standard', 'general']),
  categoryId: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  pricePaise: z.number().positive('Price must be greater than 0'),
  mrpPaise: z.number().optional(),
  gstPercent: z.number().default(18),
  hsnCode: z.string().default('84715000'),
  stockQty: z.number().nonnegative('Stock quantity cannot be negative'),
  weightGrams: z.number().positive().default(450),
  brand: z.string().optional(),
  manufacturerId: z.string().optional(),
  supplier: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  modelNumber: z.string().optional(),
  partNumber: z.string().optional(),
  voltage: z.string().optional(),
  current: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  warranty: z.string().optional(),
  bulkPriceTiers: z
    .array(
      z.object({
        minQuantity: z.number().positive(),
        maxQuantity: z.number().positive().optional(),
        unitPricePaise: z.number().positive(),
      })
    )
    .optional(),
  imageUrls: z.array(z.string()).min(1, 'Minimum 1 product image is required').max(10, 'Maximum 10 media items allowed total'),
  videoUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  relatedProductIds: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  specs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
}).superRefine((val, ctx) => {
  const imagesCount = val.imageUrls?.length || 0;
  const videoCount = val.videoUrl && val.videoUrl.trim() ? 1 : 0;
  if (imagesCount + videoCount > 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum 5 total media items allowed (images + video embed combined)',
      path: ['imageUrls'],
    });
  }
  if (val.videoUrl && val.videoUrl.trim() && !sanitizeVideoEmbedUrl(val.videoUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Video URL must be a valid YouTube or Vimeo link',
      path: ['videoUrl'],
    });
  }
});
