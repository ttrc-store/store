import { NextResponse } from 'next/server';
import { getStoreCategories } from '@/lib/mongodb/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getStoreCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error('[API /api/categories] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
