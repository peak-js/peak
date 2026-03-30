import { test, expect } from '@playwright/test';

test('simple x-for click handler', async ({ page }) => {
  await page.goto('/x-for-simple.html');

  // wait for status
  await expect(page.locator('[data-testid="status"]')).toHaveText('loaded');

  // initial state
  await expect(page.locator('[data-testid="clicked"]')).toHaveText('none');

  // wait for buttons
  await page.waitForSelector('button');

  // check button count
  const buttonCount = await page.locator('button').count();

  // click first button
  await page.locator('button', { hasText: 'Button 1' }).click();
  await expect(page.locator('[data-testid="clicked"]')).toHaveText('1');
});
