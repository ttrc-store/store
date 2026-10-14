import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: '--font-sans' }),
  Space_Grotesk: () => ({ variable: '--font-heading' }),
  JetBrains_Mono: () => ({ variable: '--font-mono' }),
}));

import manifestFn from '@/app/manifest';
import { viewport, metadata } from '@/app/layout';

describe('TTRC Store PWA Light-Theme Splash Screen & Launcher Suite', () => {
  const rootDir = process.cwd();

  // -------------------------------------------------------------------------
  // 1. Manifest Configuration Checks
  // -------------------------------------------------------------------------
  describe('Web App Manifest Configuration (public/manifest.json & src/app/manifest.ts)', () => {
    const rawManifest = fs.readFileSync(path.join(rootDir, 'public/manifest.json'), 'utf8');
    const jsonManifest = JSON.parse(rawManifest);
    const tsManifest = manifestFn();

    it('sets background_color to #FDFDFD for light-theme splash screen', () => {
      expect(jsonManifest.background_color).toBe('#FDFDFD');
      expect(tsManifest.background_color).toBe('#FDFDFD');
    });

    it('sets theme_color to #FDFDFD for status-bar and app chrome', () => {
      expect(jsonManifest.theme_color).toBe('#FDFDFD');
      expect(tsManifest.theme_color).toBe('#FDFDFD');
    });

    it('configures display mode to standalone', () => {
      expect(jsonManifest.display).toBe('standalone');
      expect(tsManifest.display).toBe('standalone');
    });

    it('sets correct application naming and start URL', () => {
      expect(jsonManifest.name).toBe('TTRC Store');
      expect(jsonManifest.short_name).toBe('TTRC Store');
      expect(jsonManifest.start_url).toBe('/');
      expect(tsManifest.name).toBe('TTRC Store');
      expect(tsManifest.short_name).toBe('TTRC Store');
      expect(tsManifest.start_url).toBe('/');
    });

    it('allows orientation to follow device default (any)', () => {
      expect(jsonManifest.orientation).toBe('any');
      expect(tsManifest.orientation).toBe('any');
    });

    it('includes standard and maskable icons with distinct purposes', () => {
      const icons = jsonManifest.icons;
      expect(icons.length).toBeGreaterThanOrEqual(3);

      const has192Any = icons.some(
        (i: any) => i.sizes === '192x192' && i.src.includes('pwa-icon-192') && i.purpose === 'any'
      );
      const has512Any = icons.some(
        (i: any) => i.sizes === '512x512' && i.src.includes('pwa-icon-512') && i.purpose === 'any'
      );
      const has512Maskable = icons.some(
        (i: any) => i.sizes === '512x512' && i.src.includes('maskable') && i.purpose === 'maskable'
      );

      expect(has192Any).toBe(true);
      expect(has512Any).toBe(true);
      expect(has512Maskable).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. HTML Viewport & Metadata Checks
  // -------------------------------------------------------------------------
  describe('HTML Viewport & Theme-Color Metadata', () => {
    it('sets HTML themeColor to #FDFDFD to match light splash theme', () => {
      expect(viewport.themeColor).toBe('#FDFDFD');
    });

    it('sets colorScheme to light to prevent OS dark mode inversion', () => {
      expect(viewport.colorScheme).toBe('light');
    });

    it('references the web app manifest and apple touch icons', () => {
      expect(metadata.manifest).toBe('/manifest.json');
      expect(metadata.icons).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Icon Asset Dimensions & Dominant Background Quality
  // -------------------------------------------------------------------------
  describe('PWA Icon Asset Verification (No Black Backgrounds)', () => {
    it('192x192 icon has exact dimensions and a clean #FDFDFD dominant background', async () => {
      const iconPath = path.join(rootDir, 'public/brand/pwa-icon-192.png');
      expect(fs.existsSync(iconPath)).toBe(true);

      const meta = await sharp(iconPath).metadata();
      expect(meta.width).toBe(192);
      expect(meta.height).toBe(192);

      const stats = await sharp(iconPath).stats();
      // Dominant color must be very light (r > 240, g > 240, b > 240) - NOT black (r < 30)
      expect(stats.dominant.r).toBeGreaterThan(240);
      expect(stats.dominant.g).toBeGreaterThan(240);
      expect(stats.dominant.b).toBeGreaterThan(240);
    });

    it('512x512 icon has exact dimensions and a clean #FDFDFD dominant background', async () => {
      const iconPath = path.join(rootDir, 'public/brand/pwa-icon-512.png');
      expect(fs.existsSync(iconPath)).toBe(true);

      const meta = await sharp(iconPath).metadata();
      expect(meta.width).toBe(512);
      expect(meta.height).toBe(512);

      const stats = await sharp(iconPath).stats();
      expect(stats.dominant.r).toBeGreaterThan(240);
      expect(stats.dominant.g).toBeGreaterThan(240);
      expect(stats.dominant.b).toBeGreaterThan(240);
    });

    it('512x512 maskable icon has safe-zone padding and light background', async () => {
      const iconPath = path.join(rootDir, 'public/brand/pwa-maskable-512.png');
      expect(fs.existsSync(iconPath)).toBe(true);

      const meta = await sharp(iconPath).metadata();
      expect(meta.width).toBe(512);
      expect(meta.height).toBe(512);

      const stats = await sharp(iconPath).stats();
      expect(stats.dominant.r).toBeGreaterThan(240);
      expect(stats.dominant.g).toBeGreaterThan(240);
      expect(stats.dominant.b).toBeGreaterThan(240);

      // Verify safe-zone boundary: all 4 outer corners must be background color #FDFDFD
      const { data, info } = await sharp(iconPath).raw().toBuffer({ resolveWithObject: true });
      const getPixel = (x: number, y: number) => {
        const idx = (y * info.width + x) * info.channels;
        return [data[idx], data[idx + 1], data[idx + 2]];
      };

      // Top-left, top-right, bottom-left, bottom-right corners
      expect(getPixel(10, 10)).toEqual([253, 253, 253]);
      expect(getPixel(500, 10)).toEqual([253, 253, 253]);
      expect(getPixel(10, 500)).toEqual([253, 253, 253]);
      expect(getPixel(500, 500)).toEqual([253, 253, 253]);
    });

    it('apple-touch-icon.png (180x180) has exact dimensions and light background', async () => {
      const iconPath = path.join(rootDir, 'public/brand/apple-touch-icon.png');
      expect(fs.existsSync(iconPath)).toBe(true);

      const meta = await sharp(iconPath).metadata();
      expect(meta.width).toBe(180);
      expect(meta.height).toBe(180);

      const stats = await sharp(iconPath).stats();
      expect(stats.dominant.r).toBeGreaterThan(240);
      expect(stats.dominant.g).toBeGreaterThan(240);
      expect(stats.dominant.b).toBeGreaterThan(240);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Service Worker & Offline Fallback Strategy
  // -------------------------------------------------------------------------
  describe('PWA Service Worker & Safe Cache Management', () => {
    it('service worker file exists and uses versioned light cache name', () => {
      const swPath = path.join(rootDir, 'public/sw.js');
      expect(fs.existsSync(swPath)).toBe(true);

      const content = fs.readFileSync(swPath, 'utf8');
      expect(content).toContain('ttrc-pwa-v2-light');
      expect(content).toContain('/offline.html');
      expect(content).toContain('skipWaiting()');
      expect(content).toContain('clients.claim()');
    });

    it('service worker strictly bypasses sensitive checkout, API, and auth requests', () => {
      const swPath = path.join(rootDir, 'public/sw.js');
      const content = fs.readFileSync(swPath, 'utf8');

      expect(content).toContain('/api/');
      expect(content).toContain('/checkout');
      expect(content).toContain('/admin');
      expect(content).toContain('/auth');
    });

    it('offline fallback page exists with light theme styles', () => {
      const offlinePath = path.join(rootDir, 'public/offline.html');
      expect(fs.existsSync(offlinePath)).toBe(true);

      const content = fs.readFileSync(offlinePath, 'utf8');
      expect(content).toContain('#FDFDFD');
      expect(content).toContain('TTRC Store');
      expect(content).toContain('Retry Connection');
    });
  });
});
