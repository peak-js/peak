const { test, expect } = require('@playwright/test');

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

