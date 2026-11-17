import { NextRequest, NextResponse } from 'next/server';
import { savePrivateCadFile, generateCadSignedToken } from '@/lib/cad/storage';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const MAX_CAD_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in request.' }, { status: 400 });
    }

    if (file.size > MAX_CAD_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / (1024 * 1024)).toFixed(
            2
          )}MB) exceeds the maximum allowed limit of 50MB.`,
        },
        { status: 400 }
      );
    }

    const filename = file.name || 'unnamed_model.stl';
    const lowerName = filename.toLowerCase();

    let format: 'STL' | 'STEP' | 'STP' | null = null;
    if (lowerName.endsWith('.stl')) {
      format = 'STL';
    } else if (lowerName.endsWith('.step')) {
      format = 'STEP';
    } else if (lowerName.endsWith('.stp')) {
      format = 'STP';
    }

    if (!format) {
      return NextResponse.json(
        {
          error:
            'Unsupported file format. Please upload a 3D model in STL (.stl) or STEP (.step, .stp) format.',
        },
        { status: 400 }
      );
    }

    const bytes = typeof file.arrayBuffer === 'function'
      ? await file.arrayBuffer()
      : (file as any).buffer;
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }

    // Save to private CAD storage
    const stored = await savePrivateCadFile({
      buffer,
      originalFilename: filename,
      format,
    });

    const user = await getCurrentUser();
    const signedToken = generateCadSignedToken({
      fileId: stored.fileId,
      userId: user?.id,
      role: user?.role,
      expiresInSeconds: 900, // 15 minutes
    });

    return NextResponse.json({
      success: true,
      fileId: stored.fileId,
      fileName: stored.originalFilename,
      fileFormat: stored.format,
      fileSize: stored.size,
      sha256: stored.sha256,
      signedUrl: `/api/3d-printing/cad/${stored.fileId}?token=${signedToken}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error handling CAD file upload.' },
      { status: 500 }
    );
  }
}
