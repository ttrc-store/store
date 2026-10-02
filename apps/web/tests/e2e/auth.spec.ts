import { test, expect } from '@playwright/test';

test.describe('Authentication & Protected Routes', () => {
  test('renders login page with Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });

  test('renders register page with registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create Your Account/i })).toBeVisible();
    await expect(page.getByPlaceholder('Karthik Raja')).toBeVisible();
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
