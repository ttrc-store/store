import { z } from 'zod';

export const ProductEnrichmentSchema = z.object({
  seoTitle: z.string().min(5).max(100),
  seoDescription: z.string().min(20).max(250),
  shortDescription: z.string().min(20).max(400),
  longDescription: z.string().min(40).max(2000),
  specs: z.array(
    z.object({
      key: z.string().min(1).max(80),
      value: z.string().min(1).max(200),
    })
  ).default([]),
  suggestedHsn: z.object({
    code: z.string().regex(/^\d{4,8}$/, 'HSN must be 4 to 8 digits'),
    confidence: z.enum(['high', 'medium', 'low']),
    reasoning: z.string(),
  }),
  applications: z.array(z.string().min(2).max(120)).default([]),
});

export type ProductEnrichmentResult = z.infer<typeof ProductEnrichmentSchema>;
