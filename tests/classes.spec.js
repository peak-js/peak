import { test, expect } from '@playwright/test';

test('classes', async ({ page }) => {
  await page.goto('/classes.html');

  // static class
  await expect(page.locator('button', { hasText: 'Static' })).toHaveClass('btn');

  // dynamic classes in active state
  await expect(page.locator('button', { hasText: 'String' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'String' })).toHaveClass(/\bactive\b/);
  await expect(page.locator('button', { hasText: 'Object' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'Object' })).toHaveClass(/\bactive\b/);
  await expect(page.locator('button', { hasText: 'Array' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'Array' })).toHaveClass(/\bactive\b/);

  // toggle active state to false
  await page.locator('button', { hasText: 'Toggle' }).click();

  // dynamic classes no longer active
  await expect(page.locator('button', { hasText: 'Static' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'String' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'String' })).not.toHaveClass(/\bactive\b/);
  await expect(page.locator('button', { hasText: 'Object' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'Object' })).not.toHaveClass(/\bactive\b/);
  await expect(page.locator('button', { hasText: 'Array' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'Array' })).not.toHaveClass(/\bactive\b/);

  // toggle active state back to true
  await page.locator('button', { hasText: 'Toggle' }).click();

  // should match original state
  await expect(page.locator('button', { hasText: 'Static' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'String' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'String' })).toHaveClass(/\bactive\b/);
  await expect(page.locator('button', { hasText: 'Object' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'Object' })).toHaveClass(/\bactive\b/);
  await expect(page.locator('button', { hasText: 'Array' })).toHaveClass(/\bbtn\b/);
  await expect(page.locator('button', { hasText: 'Array' })).toHaveClass(/\bactive\b/);
  
  // classes set visual appearance
  await expect(page.locator('button', { hasText: 'Static' })).toHaveCSS('background-color', 'rgb(255, 0, 255)'); // magenta
  await expect(page.locator('button', { hasText: 'String' })).toHaveCSS('background-color', 'rgb(0, 255, 255)'); // cyan
  await expect(page.locator('button', { hasText: 'Object' })).toHaveCSS('background-color', 'rgb(0, 255, 255)'); // cyan
  await expect(page.locator('button', { hasText: 'Array' })).toHaveCSS('background-color', 'rgb(0, 255, 255)'); // cyan
});
