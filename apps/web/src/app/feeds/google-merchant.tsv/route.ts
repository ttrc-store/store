import { generateGoogleMerchantTsv } from '@/lib/feeds/merchant-feed-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache feed for 1 hour

export async function GET(request: Request) {
  try {
    const tsv = await generateGoogleMerchantTsv();
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';

    return new Response(tsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Content-Disposition': isDownload
          ? 'attachment; filename="ttrc-google-merchant-products.tsv"'
          : 'inline; filename="ttrc-google-merchant-products.tsv"',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[Google Merchant TSV Feed Error]', err);
    return new Response(`Error: ${err.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
