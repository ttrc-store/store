import { test, expect } from '@playwright/test';

test.describe('Admin Panel Navigation & CRUD', () => {
  test.beforeEach(async ({ context }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    if (!baseURL.includes('ttrc.store')) {
      await context.addCookies([
        {
          name: 'ttrc_test_bypass',
          value: 'true',
          url: baseURL,
          path: '/',
        },
      ]);
    }
  });

  test('admin dashboard renders stats or protects route', async ({ page }) => {
    await page.goto('/admin');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/admin overview/i)).toBeVisible();
      await expect(page.getByText(/total revenue/i)).toBeVisible();
    }
  });

  test('admin products page lists catalog items or protects route', async ({ page }) => {
    await page.goto('/admin/products');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/product catalog/i)).toBeVisible();
      await expect(page.getByText(/add new product/i)).toBeVisible();
    }
  });

  test('admin add new product form loads or protects route', async ({ page }) => {
    await page.goto('/admin/products/new');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/add new product/i)).toBeVisible();
    }
  });

  test('admin category tree page renders main categories or protects route', async ({ page }) => {
    await page.goto('/admin/categories');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/category structure/i)).toBeVisible();
      await expect(page.getByText(/gamified robots/i).first()).toBeVisible();
    }
  });

  test('admin orders page renders order fulfillment table or protects route', async ({ page }) => {
    await page.goto('/admin/orders');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/order fulfillment/i)).toBeVisible();
    }
  });

  test('admin customers page renders user directory or protects route', async ({ page }) => {
    await page.goto('/admin/customers');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/customer & staff management/i)).toBeVisible();
    }
  });

  test('admin settings page renders GST & compliance form or protects route', async ({ page }) => {
    await page.goto('/admin/settings');
    const isLive = (process.env.PLAYWRIGHT_BASE_URL || '').includes('ttrc.store');
    if (isLive) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/store configuration/i)).toBeVisible();
      await expect(page.getByText(/legal entity & gst registration/i)).toBeVisible();
    }
  });
});
