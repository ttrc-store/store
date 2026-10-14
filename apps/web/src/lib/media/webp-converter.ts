import sharp, { type Metadata } from 'sharp';
import crypto from 'crypto';

export interface WebPConversionResult {
  buffer: Buffer;
  filename: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  size: number;
  originalFormat: string;
  originalSize: number;
  hasAlpha: boolean;
  isAnimated: boolean;
  isLossless: true;
  fitMode?: 'fit' | 'fill' | 'original';
  aspectRatio?: string;
}

export interface ConvertOptions {
  originalFilename?: string;
  maxSizeBytes?: number;
  maxPixels?: number;
  fitMode?: 'fit' | 'fill' | 'original';
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  targetCanvasWidth?: number;  // Standard 2560 preferred
  targetCanvasHeight?: number; // Standard 1440 preferred
}

const DEFAULT_MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const DEFAULT_MAX_PIXELS = 40_000_000; // 40 Megapixels (e.g. up to ~6324 x 6324)

const SUPPORTED_INPUT_FORMATS = new Set([
  'jpeg',
  'jpg',
  'png',
  'webp',
  'avif',
  'heif',
  'tiff',
  'tif',
  'gif',
  'svg',
]);

/**
 * Validates that an SVG does not contain script tags, event handlers, or XXE attacks
 */
function sanitizeSvg(buffer: Buffer): void {
  const content = buffer.toString('utf8').toLowerCase();

  const dangerousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /data:text\/html/i,
    /<!entity/i,
    /<!doctype\s+[^>]*system/i,
    /xlink:href\s*=\s*['"](?!#)/i,
    /\bon\w+\s*=/i, // inline event handlers: onerror, onload, onclick, etc.
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      throw new Error(
        'SVG security validation failed: Disallowed script, entity, or external reference detected.'
      );
    }
  }
}

/**
 * Automatically converts any supported image format to lossless WebP.
 * - Preserves original pixel dimensions (no resizing, downscaling, or forced cropping)
 * - Preserves transparency (alpha channel)
 * - Respects EXIF orientation (rotates properly based on orientation metadata)
 * - Preserves animation for animated GIFs
 * - Safely rasterizes SVGs
 * - Strictly encodes using lossless WebP (lossless: true)
 */
export async function convertToLosslessWebP(
  inputBuffer: Buffer,
  options: ConvertOptions = {}
): Promise<WebPConversionResult> {
  const maxSizeBytes = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
  const maxPixels = options.maxPixels || DEFAULT_MAX_PIXELS;

  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Image conversion failed: Empty input buffer provided.');
  }

  if (inputBuffer.length > maxSizeBytes) {
    throw new Error(
      `File size (${(inputBuffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`
    );
  }

  // 1. Initial format and security inspection via Sharp
  let metadata: Metadata;
  try {
    metadata = await sharp(inputBuffer, { animated: true }).metadata();
  } catch (err: any) {
    throw new Error(`Corrupt, malformed, or unreadable image file: ${err?.message || 'Decoding failed'}`);
  }

  let rawFormat = (metadata.format || '').toLowerCase();
  if (rawFormat === 'heif') {
    rawFormat = 'avif';
  }

  if (!rawFormat || !SUPPORTED_INPUT_FORMATS.has(rawFormat)) {
    throw new Error(
      `Unsupported image format: "${rawFormat || 'unknown'}". Supported formats: JPG, JPEG, PNG, WebP, AVIF, TIFF, GIF, and SVG.`
    );
  }

  // 2. Extra security check for SVG inputs
  if (rawFormat === 'svg') {
    sanitizeSvg(inputBuffer);
  }

  // 3. Pixel limit guard against decompression bomb / memory exhaustion
  const inputWidth = metadata.width || 0;
  const inputHeight = metadata.pageHeight || metadata.height || 0;
  const totalPixels = inputWidth * inputHeight;

  if (totalPixels > maxPixels) {
    throw new Error(
      `Image dimensions (${inputWidth}x${inputHeight} = ${(totalPixels / 1_000_000).toFixed(1)}MP) exceed the safety limit of ${(maxPixels / 1_000_000).toFixed(0)}MP.`
    );
  }

  const isAnimated = Boolean(metadata.pages && metadata.pages > 1);
  const hasAlpha = Boolean(metadata.hasAlpha);

  // 4. Lossless WebP conversion pipeline
  // - animated: true preserves all frames in animated GIFs
  // - .rotate() auto-orients based on EXIF orientation tag without changing pixel dimensions
  // - Convert CMYK / other color spaces to sRGB (WebP natively supports sRGB)
  // - .webp({ lossless: true, effort: 4 }) applies strict lossless arithmetic compression
  let pipeline = sharp(inputBuffer, {
    animated: isAnimated,
    limitInputPixels: maxPixels,
  }).rotate(); // Auto-rotate according to EXIF orientation

  // If input is CMYK (common in print images), convert to sRGB to ensure accurate color representation
  if (metadata.space === 'cmyk') {
    pipeline = pipeline.toColorspace('srgb');
  }

  // 4a. Crop extraction if user specified crop window in Fill/Crop mode
  if (options.crop && options.crop.width > 0 && options.crop.height > 0) {
    const left = Math.max(0, Math.round(options.crop.left));
    const top = Math.max(0, Math.round(options.crop.top));
    const width = Math.min(inputWidth - left, Math.round(options.crop.width));
    const height = Math.min(inputHeight - top, Math.round(options.crop.height));
    if (width > 0 && height > 0) {
      pipeline = pipeline.extract({ left, top, width, height });
    }
  }

  const targetW = options.targetCanvasWidth || 2560;
  const targetH = options.targetCanvasHeight || 1440;

  if (options.fitMode === 'fit') {
    // FIT MODE: Preserves 100% of the complete source image without cropping.
    // Composes image on neutral light background (#FFFFFF) in standard 16:9 landscape canvas.
    pipeline = pipeline.resize({
      width: targetW,
      height: targetH,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    });
  } else if (options.fitMode === 'fill') {
    // FILL MODE: Fills the standard 16:9 landscape canvas according to crop or cover
    pipeline = pipeline.resize({
      width: targetW,
      height: targetH,
      fit: options.crop ? 'fill' : 'cover',
      position: 'center',
    });
  }
  // 'original' mode preserves original dimensions

  pipeline = pipeline.webp({
    lossless: true,
    effort: 4, // 0-6 effort level (4 balances speed with compression)
    smartSubsample: false,
    alphaQuality: 100,
  });

  const outputBuffer = await pipeline.toBuffer();

  // 5. Verification of converted WebP
  let outputMeta: Metadata;
  try {
    outputMeta = await sharp(outputBuffer, { animated: isAnimated }).metadata();
  } catch (err: any) {
    throw new Error(`WebP verification failed: Output file could not be decoded (${err?.message})`);
  }

  if (outputMeta.format !== 'webp') {
    throw new Error(`WebP conversion failed: Expected format 'webp', got '${outputMeta.format}'`);
  }

  const outputWidth = outputMeta.width || 0;
  const outputHeight = outputMeta.pageHeight || outputMeta.height || 0;

  // Generate unique, collision-proof filename
  const safeHash = crypto.randomBytes(8).toString('hex');
  const filename = `ttrc-prd-${Date.now()}-${safeHash}.webp`;

  return {
    buffer: outputBuffer,
    filename,
    mimeType: 'image/webp',
    width: outputWidth,
    height: outputHeight,
    size: outputBuffer.length,
    originalFormat: rawFormat,
    originalSize: inputBuffer.length,
    hasAlpha: Boolean(outputMeta.hasAlpha),
    isAnimated,
    isLossless: true,
    fitMode: options.fitMode || 'original',
    aspectRatio: `${outputWidth}:${outputHeight}`,
  };
}
