import { test, expect } from '@playwright/test';

test.describe('Admin Panel Navigation & CRUD', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'ttrc_test_bypass',
        value: 'true',
        url: 'http://localhost:3000',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });
  test('admin dashboard renders stats and header', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText(/admin overview/i)).toBeVisible();
    await expect(page.getByText(/total revenue/i)).toBeVisible();
  });

  test('admin products page lists catalog items', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.getByText(/product catalog/i)).toBeVisible();
    await expect(page.getByText(/add new product/i)).toBeVisible();
  });

  test('admin add new product form loads', async ({ page }) => {
    await page.goto('/admin/products/new');
    await expect(page.getByText(/add new product/i)).toBeVisible();
  });

  test('admin category tree page renders main categories', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByText(/category structure/i)).toBeVisible();
    await expect(page.getByText(/gamified robots/i).first()).toBeVisible();
  });

  test('admin orders page renders order fulfillment table', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.getByText(/order fulfillment/i)).toBeVisible();
  });

  test('admin customers page renders user directory', async ({ page }) => {
    await page.goto('/admin/customers');
    await expect(page.getByText(/customer & staff management/i)).toBeVisible();
  });

  test('admin settings page renders GST & compliance form', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByText(/store configuration/i)).toBeVisible();
    await expect(page.getByText(/legal entity & gst registration/i)).toBeVisible();
  });
});
