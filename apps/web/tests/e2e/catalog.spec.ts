import { test, expect } from '@playwright/test';

test.describe('Storefront Catalog & Products', () => {
  test('navigates to Gamified Robots category page', async ({ page }) => {
    await page.goto('/category/gamified-robots');
    await expect(page).toHaveTitle(/Gamified Robots/i);
    await expect(page.getByRole('heading', { name: /Gamified Robots/i })).toBeVisible();
  });

  test('filters category products by Kits tab', async ({ page }) => {
    await page.goto('/category/gamified-robots?type=kit');
    await expect(page.getByRole('heading', { name: /Gamified Robots/i })).toBeVisible();
    await expect(page.locator('text=Complete Kits')).toBeVisible();
  });

  test('loads TTRC LF 6.0 Kit detail page with real data and pincode checker', async ({ page }) => {
    await page.goto('/product/ttrc-lfr-6-0');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('TTRC LF 6.0 Line Follower Robot');
    
    // Check Price Tag (Offer price ₹3,199)
    await expect(page.getByText('3,199').first()).toBeVisible();

    // Check Pincode Checker
    await expect(page.getByPlaceholder(/Pincode/i)).toBeVisible();
  });

  test('executes search and renders matching results', async ({ page }) => {
    await page.goto('/search?q=lfr');
    await expect(page.getByText(/TTRC LF 6.0/i).first()).toBeVisible();
  });
});
