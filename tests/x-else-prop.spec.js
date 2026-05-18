import { test, expect } from '@playwright/test';

test('x-else preserves :prop bindings through to child components', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('/x-else-prop.html');
  await page.waitForSelector('[data-testid="status"]');
  await expect(page.locator('[data-testid="status"]')).toHaveText('loaded');

  // Items 1 and 2 have show=false, so x-else branch renders x-echo-prop-test for them.
  // Their :name and :value should come through.
  const echoes = page.locator('[data-testid="echo"]');
  await expect(echoes).toHaveCount(2);

  // First echo (item 1, alpha/one)
  const echo1 = echoes.nth(0);
  await expect(echo1.locator('[data-testid="echo-name"]')).toHaveText('alpha');
  await expect(echo1.locator('[data-testid="echo-value"]')).toHaveText('one');

  // Second echo (item 2, beta/two)
  const echo2 = echoes.nth(1);
  await expect(echo2.locator('[data-testid="echo-name"]')).toHaveText('beta');
  await expect(echo2.locator('[data-testid="echo-value"]')).toHaveText('two');
});
