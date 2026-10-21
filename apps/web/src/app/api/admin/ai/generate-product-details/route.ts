import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { executeAITask } from '@/lib/ai/ai-gateway';
import { PROMPTS } from '@/lib/ai/prompt-registry';
import { ProductSeoSchema } from '@/lib/ai/schemas/product-seo';
import { z } from 'zod';

const RequestSchema = z.object({
  title: z.string().min(2, 'Product title is required'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  existingSpecs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  rawNotes: z.string().optional(),
  imagesCount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Enforce Admin Authorization
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const {
      title,
      brand,
      sku,
      categoryId,
      subCategoryId,
      price,
      existingSpecs,
      rawNotes,
      imagesCount,
    } = parsed.data;

    const specsContext =
      existingSpecs && existingSpecs.length > 0
        ? existingSpecs.map((s) => `${s.key}: ${s.value}`).join(', ')
        : '';

    const userPrompt = [
      `Product Title: "${title}"`,
      brand ? `Brand / Manufacturer: "${brand}"` : 'Brand: "Tamizh Tech / TTRC"',
      sku ? `SKU: "${sku}"` : '',
      `Target Category: "${categoryId || 'Robotics & Electronics'}"`,
      subCategoryId ? `Subcategory: "${subCategoryId}"` : '',
      price ? `Listed Price: ₹${price}` : '',
      specsContext ? `Known Specifications: ${specsContext}` : '',
      imagesCount ? `Available Product Images: ${imagesCount} photos uploaded` : '',
      rawNotes ? `Admin Engineering Notes / Datasheet Details: "${rawNotes}"` : '',
      'Generate authoritative, factual SEO metadata, Indian English keyword taxonomy, technical specs, HSN recommendation, AEO questions & answers, image alt text, and missing specification warnings.',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await executeAITask({
      task: 'structured_json',
      messages: [
        { role: 'system', content: PROMPTS.productSeoSystem },
        { role: 'user', content: userPrompt },
      ],
      responseFormatJson: true,
      schema: ProductSeoSchema,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      providerUsed: result.providerUsed,
    });
  } catch (error: any) {
    console.error('[Admin AI Product Details API Error]', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to generate product details with AI gateway',
      },
      { status: 500 }
    );
  }
}

