import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeBackInStockAction } from '@/actions/stock-subscriptions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';

  if (!token) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Unsubscribe - TTRC Store</title><style>body{font-family:sans-serif;padding:40px;text-align:center;color:#14141A;}</style></head>
      <body>
        <h2>Invalid Link</h2>
        <p>No valid unsubscribe token was provided.</p>
        <p><a href="/" style="color:#E3132A;">Return to TTRC Store</a></p>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    );
  }

  const res = await unsubscribeBackInStockAction(token);

  if (res.error) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Unsubscribe - TTRC Store</title><style>body{font-family:sans-serif;padding:40px;text-align:center;color:#14141A;}</style></head>
      <body>
        <h2>Unsubscribe Link Expired</h2>
        <p>${res.error}</p>
        <p><a href="/" style="color:#E3132A;">Return to TTRC Store</a></p>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>Unsubscribed - TTRC Store</title><style>body{font-family:sans-serif;padding:40px;text-align:center;color:#14141A;line-height:1.6;}h2{color:#E3132A;}</style></head>
    <body>
      <h2>Successfully Unsubscribed</h2>
      <p>${res.message}</p>
      <p style="margin-top:24px;"><a href="/" style="display:inline-block;padding:10px 20px;background:#E3132A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;">Continue to TTRC Store</a></p>
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
  );
}
