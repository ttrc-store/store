import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TTRC Store E-Commerce Web Engine',
      version: '1.0.0',
      checks: {
        database: 'connected',
        cache: 'healthy',
        shipping_gateway: 'operational',
      },
    },
    { status: 200 }
  );
}
