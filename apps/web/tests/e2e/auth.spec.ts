import { test, expect } from '@playwright/test';

test.describe('Authentication & Protected Routes', () => {
  test('renders login page with email and password sign in', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Returning Customer/i })).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
  });

  test('renders register page with registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create Your TTRC Store Account/i })).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
  });

  test('redirects unauthenticated user from /account to /login', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });

  test('blocks unauthenticated access to /admin and redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
