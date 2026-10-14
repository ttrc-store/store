import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { MediaModel } from '@/lib/mongodb/models';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename) {
      return new NextResponse('Filename missing', { status: 400 });
    }

    await connectToDatabase();
    const media = await MediaModel.findOne({ filename });

    if (!media || !media.data) {
      return new NextResponse('Media not found', { status: 404 });
    }

    return new NextResponse(media.data as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': media.mime_type || 'image/jpeg',
        'Content-Length': media.size ? media.size.toString() : media.data.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[Media Serve Error]', error);
    return new NextResponse('Internal server error loading media', { status: 500 });
  }
}
