import { generateGoogleMerchantXml } from '@/lib/feeds/merchant-feed-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache feed for 1 hour

export async function GET() {
  try {
    const xml = await generateGoogleMerchantXml();
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[Google Merchant Feed Error]', err);
    return new Response(`<?xml version="1.0"?><error>${err.message}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
