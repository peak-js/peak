import { test, expect } from '@playwright/test'

test('x-html with SVG elements does not throw on getter-only properties', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/x-html-svg.html')
  await expect(page.locator('[data-testid="status"]')).toHaveText('loaded')

  // The circle should have rendered — its cx attribute must be accessible
  await expect(page.locator('[data-testid="circle-cx"]')).toHaveText('50')

  // No "setting getter-only property" errors should have been thrown
  const getterOnlyErrors = errors.filter(e => e.includes('getter-only'))
  expect(getterOnlyErrors).toEqual([])
})
