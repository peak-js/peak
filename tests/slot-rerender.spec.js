import { test, expect } from '@playwright/test'

test('slot content updates on parent re-render', async ({ page }) => {
  await page.goto('/slot-rerender.html')

  const child = page.locator('x-slot-child')
  await expect(child).toBeVisible()

  // Template header should appear exactly once
  await expect(child.locator('.slot-header')).toHaveCount(1)

  // Initial: should see "A"
  await expect(child.locator('.marker')).toHaveText('A')

  // Toggle — parent re-renders, slot content should become "B"
  await page.click('#toggle')
  await expect(child.locator('.marker')).toHaveText('B')
  // Header must still be exactly one — no duplication from slot re-extraction
  await expect(child.locator('.slot-header')).toHaveCount(1)

  // Toggle back to "A"
  await page.click('#toggle')
  await expect(child.locator('.marker')).toHaveText('A')
  await expect(child.locator('.slot-header')).toHaveCount(1)
})
