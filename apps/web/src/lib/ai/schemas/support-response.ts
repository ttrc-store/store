import { z } from 'zod';

export const SupportResponseSchema = z.object({
  reply: z.string().min(5),
  confidence: z.enum(['high', 'medium', 'insufficient_data']),
  recommendedProducts: z
    .array(
      z.object({
        name: z.string(),
        slug: z.string(),
        reason: z.string(),
      })
    )
    .default([]),
  requiresHumanHandoff: z.boolean().default(false),
});

export type SupportResponseResult = z.infer<typeof SupportResponseSchema>;
