import { NextRequest, NextResponse } from 'next/server';
import { getStoreCategories } from '@/lib/mongodb/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mainOnly = searchParams.get('mainOnly') === 'true';
    const categories = await getStoreCategories({ mainOnly });
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error('[API /api/categories] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
