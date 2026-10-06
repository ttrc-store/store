import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { executeAITask } from '@/lib/ai/ai-gateway';
import { PROMPTS } from '@/lib/ai/prompt-registry';
import { ProductEnrichmentSchema } from '@/lib/ai/schemas/product-enrichment';
import { z } from 'zod';

const RequestSchema = z.object({
  title: z.string().min(2, 'Product title is required'),
  categoryId: z.string().optional(),
  rawNotes: z.string().optional(),
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

    const { title, categoryId, rawNotes } = parsed.data;

    const userPrompt = [
      `Product Title: "${title}"`,
      `Target Category: "${categoryId || 'Robotics & Electronics'}"`,
      rawNotes ? `Admin Engineering Notes / Datasheet Details: "${rawNotes}"` : '',
      'Generate technical specifications, HSN code recommendation, short & long descriptions, and SEO metadata.',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await executeAITask({
      task: 'structured_json',
      messages: [
        { role: 'system', content: PROMPTS.productEnrichmentSystem },
        { role: 'user', content: userPrompt },
      ],
      responseFormatJson: true,
      schema: ProductEnrichmentSchema,
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
