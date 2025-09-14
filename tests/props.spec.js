import { test, expect } from '@playwright/test';

test('dynamic message prop with expression', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-echo:has-text("HELLO")')).toBeVisible()
})

test('static message prop', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-echo:has-text("static")')).toBeVisible()
})

test('style attribute applied', async ({ page }) => {
  await page.goto('/props.html')
  const redEcho = page.locator('x-echo:has-text("red")')
  await expect(redEcho).toBeVisible()
  await expect(redEcho.locator('h1')).toHaveCSS('color', 'rgb(255, 0, 0)')
})

test('class attribute applied', async ({ page }) => {
  await page.goto('/props.html')
  const largeEcho = page.locator('x-echo:has-text("large")')
  await expect(largeEcho).toHaveClass('large')
})

test('data attributes preserved', async ({ page }) => {
  await page.goto('/props.html')
  const dataEcho = page.locator('x-echo:has-text("data-attribute")')
  await expect(dataEcho).toBeVisible()
  await expect(dataEcho).toHaveAttribute('data-delay', '0')
})

test('aria attributes preserved', async ({ page }) => {
  await page.goto('/props.html')
  const ariaEcho = page.locator('x-echo:has-text("aria-label")')
  await expect(ariaEcho).toBeVisible()
  await expect(ariaEcho).toHaveAttribute('aria-label', 'greeting')
})

test('title attribute preserved', async ({ page }) => {
  await page.goto('/props.html')
  const titleEcho = page.locator('x-echo:has-text("title-attribute")')
  await expect(titleEcho).toBeVisible()
  await expect(titleEcho).toHaveAttribute('title', 'hello')
})

test('unknown props not passed through', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-echo h1:has-text("bogus")')).toBeVisible()
  await expect(page.locator('x-echo[bogus]')).toHaveAttribute('bogus', 'invalid')
  await expect(page.locator('x-echo > span:has-text("fallback")')).toBeVisible()
})

test('dynamic string concatenation', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-echo:has-text("dynamic-concat")')).toBeVisible()
})

test('empty message prop', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-echo > h1:empty')).toHaveCount(1)
})

test('template literal with nested template', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-echo:has-text("template-literal")')).toBeVisible()
})

test('$prop defaulting pattern', async ({ page }) => {
  await page.goto('/props.html')
  await expect(page.locator('x-defaulting-test:has-text("Hello, Alice!")')).toBeVisible()
  await expect(page.locator('x-defaulting-test:has-text("Hello, Bob!")')).toBeVisible()
  await expect(page.locator('x-defaulting-test:has-text("Hello, Anonymous!")')).toBeVisible()
})

test('should not warn when passing valid props to child components', async ({ page }) => {
  // Capture console warnings
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  await page.goto('/props.html');

  // Check that the valid props are rendered correctly
  await expect(page.locator('x-echo:has-text("HELLO")')).toBeVisible();
  await expect(page.locator('x-echo:has-text("static")')).toBeVisible();
  await expect(page.locator('x-echo:has-text("red")')).toBeVisible();
  await expect(page.locator('x-echo:has-text("large")')).toBeVisible();

  // Check that no warnings were logged about valid props
  const propWarnings = warnings.filter(w => w.includes('Unknown prop') && (w.includes('message') || w.includes('style') || w.includes('class')));
  expect(propWarnings).toHaveLength(0);
});

test('should still warn when passing invalid props to child components', async ({ page }) => {
  // Capture console warnings
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  await page.goto('/props.html');

  // Check that the element with bogus prop still renders
  await expect(page.locator('x-echo:has-text("bogus")')).toBeVisible();

  // Check that we get a warning about the invalid prop
  const bogusWarnings = warnings.filter(w => w.includes('Unknown prop') && w.includes('bogus'));
  expect(bogusWarnings).toHaveLength(1);
  expect(bogusWarnings[0]).toContain('Unknown prop \'bogus\' passed to <x-echo>');
});

