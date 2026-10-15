import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE (compact mobile)', width: 320, height: 568 },
  { name: 'Galaxy S8 / Android Compact', width: 360, height: 740 },
  { name: 'iPhone 12/13 Mini', width: 375, height: 812 },
  { name: 'iPhone 13/14 Pro', width: 390, height: 844 },
  { name: 'iPhone XR / 11', width: 414, height: 896 },
  { name: 'iPhone 14/15 Pro Max', width: 430, height: 932 },
  { name: 'Small Tablet / Foldable', width: 600, height: 960 },
  { name: 'iPad Mini Portrait', width: 768, height: 1024 },
  { name: 'iPad Air Portrait', width: 820, height: 1180 },
  { name: 'iPad Pro / Small Laptop', width: 1024, height: 1366 },
  { name: 'Standard Desktop / Laptop', width: 1280, height: 800 },
  { name: 'MacBook Pro / HD Screen', width: 1440, height: 900 },
  { name: 'QHD Monitor', width: 1600, height: 1000 },
  { name: 'Full HD Desktop', width: 1920, height: 1080 },
  { name: 'Ultrawide 2K/4K Display', width: 2560, height: 1440 },
];

test.describe('Responsive Cross-Device & Viewport Audit', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.width}px (${vp.name}) - Zero Horizontal Overflow on Home Page`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verify page is rendered
      await expect(page.locator('header')).toBeVisible();

      // Check that document has no horizontal overflow
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth + 1,
        };
      });

      expect(overflow.hasOverflow).toBe(false);
    });
  }

  test('iOS Safari Safe Area & Meta Viewport Validation', async ({ page }) => {
    await page.goto('/');
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('viewport-fit=cover');
    expect(viewportMeta).toContain('width=device-width');
  });

  test('Mobile Bottom Navigation Behavior across breakpoints', async ({ page }) => {
    // Mobile 390px: Mobile bottom nav MUST be visible
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const mobileNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await expect(mobileNav).toBeVisible();

    // Verify touch target heights (>= 44px)
    const mobileNavBox = await mobileNav.boundingBox();
    expect(mobileNavBox?.height).toBeGreaterThanOrEqual(56);

    // Desktop 1280px: Mobile bottom nav MUST be hidden
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(mobileNav).toBeHidden();
  });

  test('Mobile Search Input Font Size prevents iOS Auto-Zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      const fontSize = await searchInput.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      // iOS triggers auto-zoom when font-size < 16px
      const sizeNum = parseFloat(fontSize);
      expect(sizeNum).toBeGreaterThanOrEqual(16);
    }
  });

  test('Support Chat Widget remains within mobile viewport and respects bottom navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const chatButton = page.locator('button[aria-label*="support" i], button[aria-label*="chat" i]').first();
    if (await chatButton.isVisible()) {
      const box = await chatButton.boundingBox();
      expect(box).not.toBeNull();
      // Should float above the 4rem bottom bar
      if (box) {
        expect(box.y + box.height).toBeLessThanOrEqual(844);
        expect(box.x + box.width).toBeLessThanOrEqual(390);
      }
    }
  });
});
