import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import { convertToLosslessWebP } from '@/lib/media/webp-converter';
import { POST as uploadMediaPost } from '@/app/api/admin/media/upload/route';
import { GET as getApiMedia } from '@/app/api/media/[filename]/route';
import { GET as getUploadsProducts } from '@/app/uploads/products/[filename]/route';
import { NextRequest } from 'next/server';

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } }),
}));

// Mock MongoDB
vi.mock('@/lib/mongodb/client', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

const mockMediaDb = new Map<string, any>();

vi.mock('@/lib/mongodb/models', () => ({
  MediaModel: {
    create: vi.fn().mockImplementation((doc: any) => {
      mockMediaDb.set(doc.filename, doc);
      return Promise.resolve(doc);
    }),
    findOne: vi.fn().mockImplementation(({ filename }: { filename: string }) => {
      const found = mockMediaDb.get(filename);
      return Promise.resolve(found || null);
    }),
  },
}));

describe('Lossless WebP Conversion Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaDb.clear();
  });

  // -------------------------------------------------------------------------
  // 1. Supported Input Format Conversions
  // -------------------------------------------------------------------------
  describe('Input Format Support & Lossless WebP Output', () => {
    it('converts JPEG to lossless WebP preserving exact dimensions', async () => {
      const width = 180;
      const height = 120;
      const jpegBuf = await sharp({
        create: { width, height, channels: 3, background: { r: 255, g: 50, b: 50 } },
      })
        .jpeg({ quality: 90 })
        .toBuffer();

      const result = await convertToLosslessWebP(jpegBuf, { originalFilename: 'sample.jpeg' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.filename).toMatch(/\.webp$/);
      expect(result.isLossless).toBe(true);
      expect(result.originalFormat).toBe('jpeg');
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);

      // Verify decoded WebP
      const decoded = await sharp(result.buffer).metadata();
      expect(decoded.format).toBe('webp');
      expect(decoded.width).toBe(width);
      expect(decoded.height).toBe(height);
    });

    it('converts JPG to lossless WebP preserving exact dimensions', async () => {
      const width = 200;
      const height = 150;
      const jpgBuf = await sharp({
        create: { width, height, channels: 3, background: { r: 50, g: 150, b: 255 } },
      })
        .jpeg()
        .toBuffer();

      const result = await convertToLosslessWebP(jpgBuf, { originalFilename: 'camera.jpg' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.isLossless).toBe(true);
    });

    it('converts standard PNG to lossless WebP without resizing', async () => {
      const width = 160;
      const height = 160;
      const pngBuf = await sharp({
        create: { width, height, channels: 3, background: { r: 10, g: 200, b: 10 } },
      })
        .png()
        .toBuffer();

      const result = await convertToLosslessWebP(pngBuf, { originalFilename: 'sensor.png' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.originalFormat).toBe('png');
      expect(result.isLossless).toBe(true);
    });

    it('preserves alpha transparency when converting transparent PNG to WebP', async () => {
      const width = 100;
      const height = 100;
      const transparentPng = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 120, g: 60, b: 220, alpha: 0.4 },
        },
      })
        .png()
        .toBuffer();

      const result = await convertToLosslessWebP(transparentPng, { originalFilename: 'badge.png' });

      expect(result.hasAlpha).toBe(true);
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);

      // Inspect output raw pixels to verify alpha channel is intact
      const rawOutput = await sharp(result.buffer).raw().toBuffer({ resolveWithObject: true });
      expect(rawOutput.info.channels).toBe(4); // RGBA
      expect(rawOutput.data[3]).toBeGreaterThan(0); // Alpha channel has value
      expect(rawOutput.data[3]).toBeLessThan(255); // Partially transparent preserved
    });

    it('reprocesses existing WebP losslessly without generational loss', async () => {
      const width = 140;
      const height = 90;
      const webpBuf = await sharp({
        create: { width, height, channels: 3, background: { r: 240, g: 180, b: 20 } },
      })
        .webp({ lossless: true })
        .toBuffer();

      const result = await convertToLosslessWebP(webpBuf, { originalFilename: 'existing.webp' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.originalFormat).toBe('webp');
      expect(result.isLossless).toBe(true);
    });

    it('converts TIFF to lossless WebP', async () => {
      const width = 120;
      const height = 80;
      const tiffBuf = await sharp({
        create: { width, height, channels: 3, background: { r: 90, g: 110, b: 130 } },
      })
        .tiff()
        .toBuffer();

      const result = await convertToLosslessWebP(tiffBuf, { originalFilename: 'blueprint.tiff' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.originalFormat).toBe('tiff');
    });

    it('converts AVIF to lossless WebP', async () => {
      const width = 110;
      const height = 75;
      const avifBuf = await sharp({
        create: { width, height, channels: 3, background: { r: 75, g: 175, b: 75 } },
      })
        .avif()
        .toBuffer();

      const result = await convertToLosslessWebP(avifBuf, { originalFilename: 'modern.avif' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.originalFormat).toBe('avif');
    });

    it('converts animated GIF preserving multi-frame animation into animated WebP', async () => {
      // Create a 2-frame GIF buffer
      const frame1 = await sharp({
        create: { width: 50, height: 50, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
      }).png().toBuffer();
      const frame2 = await sharp({
        create: { width: 50, height: 50, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
      }).png().toBuffer();

      const animatedGif = await sharp(frame1)
        .gif()
        .toBuffer();

      const result = await convertToLosslessWebP(animatedGif, { originalFilename: 'motion.gif' });
      expect(result.mimeType).toBe('image/webp');
      expect(result.width).toBe(50);
      expect(result.height).toBe(50);
    });

    it('safely rasterizes clean SVG to lossless WebP', async () => {
      const cleanSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#E3132A"/></svg>'
      );

      const result = await convertToLosslessWebP(cleanSvg, { originalFilename: 'vector-diagram.svg' });

      expect(result.mimeType).toBe('image/webp');
      expect(result.originalFormat).toBe('svg');
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Security, Validation & Attack Mitigation
  // -------------------------------------------------------------------------
  describe('Security and Attack Mitigation', () => {
    it('rejects SVG files containing <script> tags to prevent XSS attacks', async () => {
      const maliciousSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script><rect width="50" height="50"/></svg>'
      );

      await expect(
        convertToLosslessWebP(maliciousSvg, { originalFilename: 'xss.svg' })
      ).rejects.toThrow(/security validation failed/i);
    });

    it('rejects SVG files with javascript: URI handlers', async () => {
      const maliciousSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><circle r="10"/></a></svg>'
      );

      await expect(
        convertToLosslessWebP(maliciousSvg, { originalFilename: 'js-handler.svg' })
      ).rejects.toThrow(/security validation failed/i);
    });

    it('rejects SVG files with inline event handlers like onload', async () => {
      const maliciousSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="50" height="50"/></svg>'
      );

      await expect(
        convertToLosslessWebP(maliciousSvg, { originalFilename: 'event-handler.svg' })
      ).rejects.toThrow(/security validation failed/i);
    });

    it('rejects corrupt or truncated image files with clear message', async () => {
      const corruptData = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ... not valid binary');

      await expect(
        convertToLosslessWebP(corruptData, { originalFilename: 'broken.webp' })
      ).rejects.toThrow(/Corrupt, malformed, or unreadable/i);
    });

    it('rejects spoofed files disguised with an image extension', async () => {
      const fakeText = Buffer.from('This is a plain text file, not a genuine JPEG');

      await expect(
        convertToLosslessWebP(fakeText, { originalFilename: 'fake.jpg' })
      ).rejects.toThrow(/Corrupt, malformed, or unreadable/i);
    });

    it('rejects oversized files exceeding maximum byte limit', async () => {
      const smallLimit = 1000;
      const buffer = Buffer.alloc(5000);

      await expect(
        convertToLosslessWebP(buffer, { maxSizeBytes: smallLimit })
      ).rejects.toThrow(/exceeds maximum limit/i);
    });

    it('rejects decompression bombs with excessive image dimensions', async () => {
      // 10,000 x 10,000 pixels = 100 Megapixels
      // Sharp allows metadata inspection without decompressing the full bitmap
      const hugeSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10000" height="10000"></svg>'
      );

      await expect(
        convertToLosslessWebP(hugeSvg, { maxPixels: 40_000_000 })
      ).rejects.toThrow(/exceed the safety limit/i);
    });
  });

  // -------------------------------------------------------------------------
  // 3. API Route Upload & Delivery Endpoints
  // -------------------------------------------------------------------------
  describe('Admin Media Upload & Storefront Serving Endpoints', () => {
    it('successfully processes upload via POST /api/admin/media/upload and stores lossless WebP in MediaModel', async () => {
      const pngBuf = await sharp({
        create: { width: 150, height: 100, channels: 3, background: { r: 100, g: 150, b: 200 } },
      })
        .png()
        .toBuffer();

      const formData = new FormData();
      const file = new File([pngBuf], 'robot-chassis.png', { type: 'image/png' });
      file.arrayBuffer = async () => pngBuf.buffer;
      formData.append('file', file);

      const req = new NextRequest('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
      });
      // Mock formData method on the request object for isolated unit test
      (req as any).formData = async () => formData;

      const res = await uploadMediaPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.url).toMatch(/^\/api\/media\/ttrc-prd-.*\.webp$/);
      expect(json.mimeType).toBe('image/webp');
      expect(json.width).toBe(150);
      expect(json.height).toBe(100);
      expect(json.isLossless).toBe(true);

      // Verify stored in mocked MediaModel
      const stored = mockMediaDb.get(json.filename);
      expect(stored).toBeDefined();
      expect(stored.mime_type).toBe('image/webp');
      expect(stored.width).toBe(150);
      expect(stored.height).toBe(100);
      expect(stored.is_lossless).toBe(true);
    });

    it('serves Content-Type: image/webp from /api/media/[filename]', async () => {
      const filename = 'ttrc-prd-sample-123.webp';
      const fakeWebp = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8L...');
      mockMediaDb.set(filename, {
        filename,
        mime_type: 'image/webp',
        size: fakeWebp.length,
        data: fakeWebp,
      });

      const req = new NextRequest(`http://localhost:3000/api/media/${filename}`);
      const res = await getApiMedia(req, { params: Promise.resolve({ filename }) });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/webp');
      expect(res.headers.get('Cache-Control')).toContain('public, max-age=31536000, immutable');
    });

    it('serves Content-Type: image/webp from /uploads/products/[filename]', async () => {
      const filename = 'ttrc-prd-sample-456.webp';
      const fakeWebp = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8L...');
      mockMediaDb.set(filename, {
        filename,
        mime_type: 'image/webp',
        size: fakeWebp.length,
        data: fakeWebp,
      });

      const req = new NextRequest(`http://localhost:3000/uploads/products/${filename}`);
      const res = await getUploadsProducts(req, { params: Promise.resolve({ filename }) });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/webp');
      expect(res.headers.get('Cache-Control')).toContain('public, max-age=31536000, immutable');
    });

    it('rejects unauthenticated upload when requireAdmin fails', async () => {
      const { requireAdmin } = await import('@/lib/auth-helpers');
      (requireAdmin as any).mockResolvedValueOnce({ error: 'Unauthorized', status: 401 });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.png', { type: 'image/png' }));

      const req = new NextRequest('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const res = await uploadMediaPost(req);
      expect(res.status).toBe(401);
    });

    it('rejects non-admin customer upload when requireAdmin returns 403 Forbidden', async () => {
      const { requireAdmin } = await import('@/lib/auth-helpers');
      (requireAdmin as any).mockResolvedValueOnce({ error: 'Forbidden: Admin access required', status: 403 });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.png', { type: 'image/png' }));

      const req = new NextRequest('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const res = await uploadMediaPost(req);
      expect(res.status).toBe(403);
    });
  });
});
