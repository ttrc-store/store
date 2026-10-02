import { NextRequest, NextResponse } from 'next/server';
import { searchStoreProducts } from '@/lib/mongodb/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
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
