import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintFileModel, IPrintFile } from '@/lib/mongodb/models';

const JWT_SECRET = process.env.JWT_SECRET || 'ttrc-cad-secure-token-2026-secret-key';
const STORAGE_BASE_DIR = path.join(process.cwd(), 'storage', 'cad');
const ORIGINALS_DIR = path.join(STORAGE_BASE_DIR, 'originals');
const PREVIEWS_DIR = path.join(STORAGE_BASE_DIR, 'previews');

// Ensure base directories exist on local filesystem
async function ensureDirectories() {
  try {
    await fs.mkdir(ORIGINALS_DIR, { recursive: true });
    await fs.mkdir(PREVIEWS_DIR, { recursive: true });
  } catch {
    // Read-only filesystem in serverless environments; will rely on MongoDB chunk storage
  }
}

export interface StoredCadFile {
  fileId: string;
  originalFilename: string;
  format: 'STL' | 'STEP' | 'STP';
  size: number;
  sha256: string;
  storagePath: string;
  storageType: 'local_private' | 'mongo_buffer';
}

/**
 * Stores uploaded CAD raw binary securely.
 * Saves to private local filesystem if writable, and simultaneously persists in PrintFileModel
 * so files survive serverless cold starts.
 */
export async function savePrivateCadFile(params: {
  buffer: Buffer;
  originalFilename: string;
  format: 'STL' | 'STEP' | 'STP';
  requestId?: string;
  isPreview?: boolean;
}): Promise<StoredCadFile> {
  const { buffer, originalFilename, format, requestId, isPreview = false } = params;

  await ensureDirectories();
  const fileId = `cad_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const sanitizedExt = format.toLowerCase();
  const filename = `${fileId}.${sanitizedExt}`;

  const targetDir = isPreview ? PREVIEWS_DIR : ORIGINALS_DIR;
  const relativePath = path.join(isPreview ? 'previews' : 'originals', filename);
  const diskPath = path.join(targetDir, filename);

  let storageType: 'local_private' | 'mongo_buffer' = 'local_private';
  let bufferToSaveInDb: Buffer | undefined = undefined;

  // Try writing to private filesystem first
  try {
    await fs.writeFile(diskPath, buffer);
  } catch {
    storageType = 'mongo_buffer';
    bufferToSaveInDb = buffer; // Only store raw buffer in MongoDB if filesystem is read-only
  }

  // Connect to database and save file metadata
  await connectToDatabase();
  const mimeType =
    format === 'STL'
      ? 'model/stl'
      : format === 'STEP' || format === 'STP'
      ? 'model/step'
      : 'application/octet-stream';

  await PrintFileModel.create({
    file_id: fileId,
    request_id: requestId,
    filename,
    original_filename: originalFilename,
    mime_type: mimeType,
    size: buffer.length,
    sha256,
    storage_path: relativePath,
    storage_type: storageType,
    data: bufferToSaveInDb,
    is_preview: isPreview,
  });

  return {
    fileId,
    originalFilename,
    format,
    size: buffer.length,
    sha256,
    storagePath: relativePath,
    storageType,
  };
}

/**
 * Retrieves a private CAD file buffer, trying disk first, then MongoDB chunk buffer.
 */
export async function getPrivateCadFile(fileId: string): Promise<{
  file: IPrintFile;
  buffer: Buffer;
} | null> {
  await connectToDatabase();
  const record = await PrintFileModel.findOne({ file_id: fileId });
  if (!record) return null;

  // 1. Try reading from private disk path
  try {
    const fullDiskPath = path.join(STORAGE_BASE_DIR, record.storage_path);
    const diskBuffer = await fs.readFile(fullDiskPath);
    return { file: record, buffer: diskBuffer };
  } catch {
    // 2. Fall back to MongoDB buffer
    if (record.data && Buffer.isBuffer(record.data)) {
      return { file: record, buffer: record.data };
    }
  }

  return null;
}

/**
 * Generates a short-lived signed access token for streaming CAD files to authorized clients.
 * Expires in 15 minutes (900 seconds) by default.
 */
export function generateCadSignedToken(params: {
  fileId: string;
  userId?: string;
  role?: string;
  requestId?: string;
  expiresInSeconds?: number;
}): string {
  const { fileId, userId, role, requestId, expiresInSeconds = 900 } = params;
  return jwt.sign(
    {
      cadFileId: fileId,
      sub: userId || 'anonymous',
      role: role || 'guest',
      reqId: requestId,
    },
    JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Validates a signed CAD access token.
 */
export function verifyCadSignedToken(token: string): {
  valid: boolean;
  fileId?: string;
  userId?: string;
  role?: string;
  requestId?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      cadFileId: string;
      sub: string;
      role: string;
      reqId?: string;
    };
    return {
      valid: true,
      fileId: decoded.cadFileId,
      userId: decoded.sub,
      role: decoded.role,
      requestId: decoded.reqId,
    };
  } catch {
    return { valid: false };
  }
}
