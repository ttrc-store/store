import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { MediaModel } from '@/lib/mongodb/models';
import { convertToLosslessWebP } from '@/lib/media/webp-converter';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/gif',
  'image/svg+xml',
]);

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed limit of 15MB.` },
        { status: 400 }
      );
    }

    const declaredType = (file.type || '').toLowerCase();
    if (declaredType && !ALLOWED_MIME_TYPES.has(declaredType) && !declaredType.startsWith('image/')) {
      return NextResponse.json(
        { error: `Unsupported MIME type: "${declaredType}". Supported: JPEG, PNG, WebP, AVIF, TIFF, GIF, SVG.` },
        { status: 400 }
      );
    }

    const bytes = typeof file.arrayBuffer === 'function'
      ? await file.arrayBuffer()
      : (file as any).buffer || Buffer.from(await (file as any).text());
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }

    // 16:9 Landscape Standard Canvas & Crop Options
    const fitMode = (formData.get('fitMode') as string) || 'original';
    const cropX = formData.get('cropX') ? parseFloat(formData.get('cropX') as string) : undefined;
    const cropY = formData.get('cropY') ? parseFloat(formData.get('cropY') as string) : undefined;
    const cropWidth = formData.get('cropWidth') ? parseFloat(formData.get('cropWidth') as string) : undefined;
    const cropHeight = formData.get('cropHeight') ? parseFloat(formData.get('cropHeight') as string) : undefined;
    const targetWidth = formData.get('targetWidth') ? parseInt(formData.get('targetWidth') as string, 10) : 2560;
    const targetHeight = formData.get('targetHeight') ? parseInt(formData.get('targetHeight') as string, 10) : 1440;

    const crop =
      cropWidth && cropHeight && cropWidth > 0 && cropHeight > 0
        ? { left: cropX || 0, top: cropY || 0, width: cropWidth, height: cropHeight }
        : undefined;

    // Convert automatically to Lossless WebP using Sharp pipeline
    let converted;
    try {
      converted = await convertToLosslessWebP(buffer, {
        originalFilename: file.name,
        maxSizeBytes: MAX_UPLOAD_BYTES,
        fitMode: (fitMode as any) || 'original',
        crop,
        targetCanvasWidth: targetWidth || 2560,
        targetCanvasHeight: targetHeight || 1440,
      });
    } catch (conversionErr: any) {
      return NextResponse.json(
        { error: conversionErr?.message || 'Image processing failed during lossless WebP conversion.' },
        { status: 400 }
      );
    }

    // 1. Persist directly to MongoDB Atlas MediaModel
    await connectToDatabase();
    await MediaModel.create({
      filename: converted.filename,
      original_name: file.name,
      mime_type: 'image/webp',
      size: converted.size,
      data: converted.buffer,
      width: converted.width,
      height: converted.height,
      original_format: converted.originalFormat,
      original_size: converted.originalSize,
      is_lossless: true,
      fit_mode: converted.fitMode,
      aspect_ratio: converted.aspectRatio,
    });

    // 2. Best-effort local filesystem cache (Writable on local/Docker, gracefully ignored on Vercel Read-Only)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, converted.filename), converted.buffer);
    } catch {
      // Ignored: On Vercel serverless /var/task is read-only. Media is safely served from MongoDB Atlas via /api/media.
    }

    const publicUrl = `/api/media/${converted.filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: converted.filename,
      size: converted.size,
      mimeType: 'image/webp',
      width: converted.width,
      height: converted.height,
      originalFormat: converted.originalFormat,
      originalSize: converted.originalSize,
      isLossless: true,
      fitMode: converted.fitMode,
      aspectRatio: converted.aspectRatio,
      isAnimated: converted.isAnimated,
      hasAlpha: converted.hasAlpha,
    });
  } catch (err: any) {
    console.error('[Media Upload] error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}
