import { test, expect } from '@playwright/test';

test.describe('Cart & Checkout Flow', () => {
  test('cart page renders empty state initially', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });

  test('checkout page renders empty cart message when empty', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });

  test('order confirmation success page renders for valid order', async ({ page }) => {
    await page.goto('/checkout/success?orderNumber=TTRC%2F25-26%2F987654');
    await expect(page.getByRole('heading', { name: /thank you for your order/i })).toBeVisible();
    await expect(page.getByText('TTRC/25-26/987654')).toBeVisible();
  });

  test('order tracking page renders timeline for order', async ({ page }) => {
    await page.goto('/orders/TTRC%2F25-26%2F987654');
    await expect(page.getByText(/TTRC\/25-26\/987654/)).toBeVisible();
    await expect(page.getByText(/shiprocket shipment tracking/i)).toBeVisible();
  });
});
