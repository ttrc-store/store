import { NextRequest, NextResponse } from 'next/server';
import { searchStoreProducts } from '@/lib/mongodb/catalog';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client';
    const rateLimit = await checkRateLimit({
      key: `search:${ip}`,
      limit: 40,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Search rate limit exceeded. Please slow down.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim().slice(0, 100);

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const products = await searchStoreProducts(query, { limit: 8 });

    return NextResponse.json({
      results: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        pricePaise: p.pricePaise,
        mrpPaise: p.mrpPaise,
        imageUrl: p.imageUrls?.[0] || '/brand/ttrc-logo.png',
        type: p.type,
        stockQty: p.stockQty,
      })),
    });
  } catch (err: any) {
    console.error('[API /api/search] Error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
