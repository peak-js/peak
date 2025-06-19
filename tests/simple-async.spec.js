const { test, expect } = require('@playwright/test');

test('simple async mounted lifecycle', async ({ page }) => {
  await page.goto('/simple-async.html');

  // Should show initial values
  await expect(page.locator('[data-testid="items-count"]')).toHaveText('initial');
  await expect(page.locator('[data-testid="message"]')).toHaveText('mounting...');
  await expect(page.locator('[data-testid="loading"]')).toHaveText('Loading...');

  // After async operation completes
  await expect(page.locator('[data-testid="items-count"]')).toHaveText('42');
  await expect(page.locator('[data-testid="message"]')).toHaveText('mounted!');
  await expect(page.locator('[data-testid="loading"]')).toHaveText('Done');
});
