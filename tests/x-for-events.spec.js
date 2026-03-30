import { test, expect } from '@playwright/test';

test('x-for event handlers have proper context', async ({ page }) => {
  await page.goto('/x-for-events.html');

  // wait for buttons to be rendered
  await page.waitForSelector('button');

  // initial state
  await expect(page.locator('[data-testid="click-count"]')).toHaveText('0');
  await expect(page.locator('[data-testid="last-clicked"]')).toHaveText('none');
  await expect(page.locator('[data-testid="item-value"]')).toHaveText('none');

  // click first item
  await page.locator('button', { hasText: 'Item 1' }).click();
  await expect(page.locator('[data-testid="click-count"]')).toHaveText('1');
  await expect(page.locator('[data-testid="last-clicked"]')).toHaveText('Item 1');

  // this will fail with original code because 'item' is not accessible
  await expect(page.locator('[data-testid="item-value"]')).toHaveText('undefined');
});
