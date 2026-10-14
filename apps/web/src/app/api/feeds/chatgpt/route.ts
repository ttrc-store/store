import { generateChatGptProductJson } from '@/lib/feeds/merchant-feed-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  try {
    const data = await generateChatGptProductJson();
    return Response.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[ChatGPT Product Feed API Error]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
