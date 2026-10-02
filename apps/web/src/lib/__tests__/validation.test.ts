import { describe, it, expect } from 'vitest';
import { sanitizeVideoEmbedUrl, ProductSchema } from '@/lib/video-utils';
import { calculateDiscount } from '@ttrc/shared';

describe('Video URL Allowlist & Embed Sanitization', () => {
  it('accepts valid YouTube URLs and returns clean privacy-enhanced embed URL', () => {
    expect(sanitizeVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    expect(sanitizeVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    expect(sanitizeVideoEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
  });

  it('accepts valid Vimeo URLs and returns official player embed URL', () => {
    expect(sanitizeVideoEmbedUrl('https://vimeo.com/76979871')).toBe(
      'https://player.vimeo.com/video/76979871'
    );
  });

  it('rejects arbitrary domains and unallowed video platforms', () => {
    expect(sanitizeVideoEmbedUrl('https://dailymotion.com/video/x7g8h9')).toBeUndefined();
    expect(sanitizeVideoEmbedUrl('https://malicious-site.com/video.mp4')).toBeUndefined();
    expect(sanitizeVideoEmbedUrl('https://tiktok.com/@user/video/123')).toBeUndefined();
  });

  it('rejects XSS attempts and arbitrary HTML/script injection', () => {
    expect(sanitizeVideoEmbedUrl('<script>alert("xss")</script>')).toBeUndefined();
    expect(sanitizeVideoEmbedUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeVideoEmbedUrl('<iframe src="https://evil.com"></iframe>')).toBeUndefined();
  });

  it('handles empty or whitespace inputs gracefully', () => {
    expect(sanitizeVideoEmbedUrl(undefined)).toBeUndefined();
    expect(sanitizeVideoEmbedUrl('')).toBeUndefined();
    expect(sanitizeVideoEmbedUrl('   ')).toBeUndefined();
  });
});

describe('Product Form Media Limit Validation', () => {
  const validBaseProduct = {
    name: 'STEM Robotics Starter Kit',
    slug: 'stem-robotics-starter-kit',
    productType: 'kit' as const,
    pricePaise: 249900,
    mrpPaise: 349900,
    stockQty: 10,
    imageUrls: ['https://example.com/img1.jpg'],
  };

  it('passes validation for 1 image and no video', () => {
    const result = ProductSchema.safeParse(validBaseProduct);
    expect(result.success).toBe(true);
  });

  it('passes validation for 5 images and 0 videos (exact limit)', () => {
    const product = {
      ...validBaseProduct,
      imageUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it('passes validation for 4 images and 1 valid video (5 total media items)', () => {
    const product = {
      ...validBaseProduct,
      imageUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
      ],
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it('fails validation when total media items exceed 5 (4 images + 1 video = OK, 5 images + 1 video = 6 media items)', () => {
    const product = {
      ...validBaseProduct,
      imageUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e: { message: string }) => e.message.includes('Maximum 5 total media items allowed'))).toBe(true);
    }
  });

  it('fails validation when image count exceeds 5', () => {
    const product = {
      ...validBaseProduct,
      imageUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
        'https://example.com/6.jpg',
      ],
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
  });

  it('fails validation when video URL is unapproved or invalid format', () => {
    const product = {
      ...validBaseProduct,
      videoUrl: 'https://untrusted-video-host.com/watch?v=123',
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e: { message: string }) => e.message.includes('YouTube or Vimeo link'))).toBe(true);
    }
  });
});

describe('Auto-Calculated Discount Math Validation', () => {
  it('calculates accurate rounded percentage savings when MRP > price', () => {
    expect(calculateDiscount(249900, 349900)).toBe(29); // 28.57% -> 29%
    expect(calculateDiscount(150000, 200000)).toBe(25); // 25%
    expect(calculateDiscount(10000, 50000)).toBe(80);  // 80%
    expect(calculateDiscount(99900, 100000)).toBe(0);   // 0.1% -> 0%
  });

  it('returns 0 discount when MRP is equal to or lower than selling price', () => {
    expect(calculateDiscount(250000, 250000)).toBe(0);
    expect(calculateDiscount(300000, 250000)).toBe(0);
  });

  it('handles invalid or zero MRP safely without divide-by-zero error', () => {
    expect(calculateDiscount(250000, 0)).toBe(0);
  });
});
