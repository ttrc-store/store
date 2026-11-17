import { NextRequest, NextResponse } from 'next/server';
import { getPrivateCadFile, verifyCadSignedToken } from '@/lib/cad/storage';
import { getCurrentUser } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel } from '@/lib/mongodb/models';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  let isAuthorized = false;

  // 1. Check if valid signed token is supplied
  if (token) {
    const verified = verifyCadSignedToken(token);
    if (verified.valid && verified.fileId === fileId) {
      isAuthorized = true;
    }
  }

  // 2. If not authorized by token, check session
  if (!isAuthorized) {
    const user = await getCurrentUser();
    if (user) {
      if (user.role === 'admin' || user.role === 'staff') {
        isAuthorized = true;
      } else {
        // Customer: verify ownership of the linked request
        await connectToDatabase();
        const request = await PrintRequestModel.findOne({
          $or: [
            { 'file.file_id': fileId, user_id: user.id },
            { 'file.file_id': fileId, 'customer.email': user.email.toLowerCase() },
          ],
        });
        if (request) {
          isAuthorized = true;
        }
      }
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Access to this CAD file is protected.' },
      { status: 403 }
    );
  }

  const stored = await getPrivateCadFile(fileId);
  if (!stored) {
    return NextResponse.json({ error: 'CAD file not found.' }, { status: 404 });
  }

  const uint8 = new Uint8Array(stored.buffer);
  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': stored.file.mime_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(stored.file.original_filename)}"`,
      'Content-Length': stored.buffer.length.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
