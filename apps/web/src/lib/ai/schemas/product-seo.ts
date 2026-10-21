import { z } from 'zod';

export const SearchQuestionSchema = z.object({
  question: z.string().min(5).max(180),
  answer: z.string().min(10).max(600),
});

export const ProductSeoSchema = z.object({
  primaryKeyword: z.string().min(2).max(100),
  secondaryKeywords: z.array(z.string().min(2).max(80)).min(3).max(12),
  transactionalPhrases: z.array(z.string().min(2).max(100)).max(8).default([]),
  technicalSynonyms: z.array(z.string().min(2).max(80)).max(8).default([]),
  searchIntent: z.enum(['transactional', 'commercial', 'informational']),
  seoTitle: z.string().min(10).max(100),
  metaDescription: z.string().min(40).max(250),
  suggestedSlug: z.string().min(3).max(120),
  shortDescription: z.string().min(20).max(400),
  longDescription: z.string().min(60).max(3000),
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
  compatibilityNotes: z.array(z.string().min(2).max(150)).default([]),
  faqs: z.array(SearchQuestionSchema).min(2).max(6),
  imageAltText: z.string().min(5).max(150),
  internalLinkSuggestions: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
      reason: z.string(),
    })
  ).default([]),
  missingSpecsWarnings: z.array(z.string()).default([]),
});

export type ProductSeoResult = z.infer<typeof ProductSeoSchema>;
