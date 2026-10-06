import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { connectToDatabase } from '@/lib/mongodb/client';
import { ProductModel, CategoryModel, ProductCompatibilityModel, SiteSettingModel } from '@/lib/mongodb/models';
import { executeAITask } from '@/lib/ai/ai-gateway';
import { PROMPTS } from '@/lib/ai/prompt-registry';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(1000),
});

const RequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000),
  history: z.array(ChatMessageSchema).max(10).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 12 queries per minute per client IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimit = await checkRateLimit({
    key: `ai_support:${clientIp}`,
    limit: 12,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many queries. Please wait a moment before sending another message.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { message, history = [] } = parsed.data;

    // 2. RAG Retrieval from MongoDB
    await connectToDatabase();

    // Extract search keywords from message
    const keywords = message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 2 &&
          !['what', 'which', 'with', 'this', 'that', 'have', 'from', 'does', 'your', 'about', 'need', 'want'].includes(
            w
          )
      );

    let matchedProducts: any[] = [];
    let compatibilityNotes: string[] = [];

    if (keywords.length > 0) {
      const regexPatterns = keywords.map((k) => new RegExp(k, 'i'));
      matchedProducts = await ProductModel.find({
        is_active: true,
        $or: [
          { name: { $in: regexPatterns } },
          { slug: { $in: regexPatterns } },
          { sku: { $in: regexPatterns } },
          { brand: { $in: regexPatterns } },
          { category_id: { $in: regexPatterns } },
          { applications: { $in: regexPatterns } },
        ],
      })
        .limit(6)
        // STRICT PRIVACY: NEVER SELECT cost_price, landed_cost, supplier, OR internal_notes
        .select(
          'name slug sku price compare_at_price stock_quantity product_type voltage current power dimensions material warranty bulk_price_tiers'
        )
        .lean();

      // If products found, check product_compatibility table for verified relations
      if (matchedProducts.length > 0) {
        const productIds = matchedProducts.map((p) => p._id.toString());
        const compatRecords = await ProductCompatibilityModel.find({
          $or: [{ spare_part_id: { $in: productIds } }, { kit_id: { $in: productIds } }],
        }).lean();

        if (compatRecords.length > 0) {
          const linkedIds = new Set<string>();
          compatRecords.forEach((c) => {
            linkedIds.add(c.spare_part_id);
            linkedIds.add(c.kit_id);
          });

          const linkedProducts = await ProductModel.find({
            _id: { $in: Array.from(linkedIds) },
          })
            .select('name slug')
            .lean();

          const nameMap = new Map(linkedProducts.map((p) => [p._id.toString(), p.name]));

          compatibilityNotes = compatRecords.map((c) => {
            const spareName = nameMap.get(c.spare_part_id) || c.spare_part_id;
            const kitName = nameMap.get(c.kit_id) || c.kit_id;
            return `Verified Compatible: Spare Part "${spareName}" is compatible with Kit "${kitName}".`;
          });
        }
      }
    }

    // Retrieve active categories
    const categories = await CategoryModel.find({ is_active: true })
      .select('name slug description')
      .limit(10)
      .lean();

    // Retrieve active store settings
    const settings = await SiteSettingModel.find({
      key: {
        $in: [
          'free_shipping_threshold_paise',
          'cod_limit_paise',
          'cod_fee_paise',
          'support_phone',
          'support_email',
          'gst_enabled',
        ],
      },
    }).lean();

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    // Construct grounded context
    const productsContext =
      matchedProducts.length > 0
        ? matchedProducts
            .map((p) => {
              const bulkInfo =
                p.bulk_price_tiers && p.bulk_price_tiers.length > 0
                  ? ` | Bulk: ${p.bulk_price_tiers
                      .map((b: any) => `${b.min_quantity}+ pcs @ ₹${(b.price_paise / 100).toFixed(0)}`)
                      .join(', ')}`
                  : '';

              return `- [${p.name}] (Link: /product/${p.slug}, SKU: ${p.sku}): Price: ₹${(
                p.price / 100
              ).toFixed(0)}, Stock: ${p.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}${
                p.voltage ? `, Voltage: ${p.voltage}` : ''
              }${p.current ? `, Current: ${p.current}` : ''}${p.power ? `, Power: ${p.power}` : ''}${
                p.dimensions ? `, Dimensions: ${p.dimensions}` : ''
              }${p.material ? `, Material: ${p.material}` : ''}${bulkInfo}`;
            })
            .join('\n')
        : 'No specific products matched search keywords in catalog.';

    const categoriesContext = categories
      .map((c) => `- ${c.name} (Link: /category/${c.slug}): ${c.description || ''}`)
      .join('\n');

    const compatContext =
      compatibilityNotes.length > 0
        ? compatibilityNotes.join('\n')
        : 'No specific compatibility records found in database for these queried items.';

    const groundedContext = `
ACTIVE CATALOG CATEGORIES:
${categoriesContext}

MATCHED PRODUCT INVENTORY:
${productsContext}

VERIFIED COMPATIBILITY RECORDS:
${compatContext}

STORE SETTINGS & POLICIES:
- Free Shipping Threshold: ₹${((settingsMap.get('free_shipping_threshold_paise') || 99900) / 100).toFixed(0)}
- COD Limit: ₹${((settingsMap.get('cod_limit_paise') || 500000) / 100).toFixed(0)} (COD Fee: ₹${(
      (settingsMap.get('cod_fee_paise') || 4900) / 100
    ).toFixed(0)})
- GST Invoicing: ${settingsMap.get('gst_enabled') ? 'Official GST Tax Invoices generated' : 'Bill of Supply / Sale Receipt generated'}
- Support Email: ${settingsMap.get('support_email') || 'support@ttrc.store'}
- Support Phone: ${settingsMap.get('support_phone') || '+91 7904902978'}
- Returns/Cancellations: Return within 7 days for manufacturing defects; cancellations allowed before dispatch.
`.trim();

    // 3. Assemble chat messages
    const systemPrompt = PROMPTS.customerSupportSystem(groundedContext);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: message },
    ];

    // 4. Dispatch to AI Gateway (Task Router selects Groq -> OpenRouter -> Gemini)
    const result = await executeAITask<string>({
      task: 'customer_support',
      messages,
    });

    return NextResponse.json({
      success: true,
      reply: result.data,
      providerUsed: result.providerUsed,
    });
  } catch (error: any) {
    console.error('[Customer Support AI API Error]', error);
    return NextResponse.json(
      {
        error:
          'I am temporarily unable to retrieve that information. Please reach out directly to our engineering team at support@ttrc.store or WhatsApp.',
      },
      { status: 500 }
    );
  }
}
