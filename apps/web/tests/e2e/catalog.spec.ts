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

  test('loads Robo Race Kit detail page with spare parts & pincode checker', async ({ page }) => {
    await page.goto('/product/robo-race-pro-competition-chassis-kit');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Robo Race Pro Competition Chassis Kit v2.0');
    
    // Check Price Tag
    await expect(page.getByText(/Inclusive of all GST/i)).toBeVisible();

    // Check Pincode Checker
    await expect(page.getByPlaceholder(/Enter 6-digit Pincode/i)).toBeVisible();

    // Check Compatible Spare Parts Section for Kit
    await expect(page.getByRole('heading', { name: /Compatible Spare Parts for this Kit/i })).toBeVisible();

    // Check Frequently Bought Together Bundle Box
    await expect(page.locator('text=Frequently Bought Together Bundle')).toBeVisible();
  });

  test('loads N20 Spare Part detail page with compatible kits back-link', async ({ page }) => {
    await page.goto('/product/n20-micro-metal-gear-motor-300rpm-6v');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('N20 Micro Metal Gear Motor');

    // Check Compatible Kits section for Spare Part
    await expect(page.getByRole('heading', { name: /Compatible Kits/i })).toBeVisible();
  });

  test('executes search and renders matching results', async ({ page }) => {
    await page.goto('/search?q=motor');
    await expect(page.getByRole('heading', { name: /Search results for "motor"/i })).toBeVisible();
  });
});
