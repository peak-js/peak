import { test, expect } from '@playwright/test'

test('boolean :prop binding — false hides x-if content', async ({ page }) => {
  await page.goto('/bool-prop.html')

  // Wait for parent to render
  await expect(page.locator('x-bool-parent')).toBeVisible()

  // The initial value is false, so "INACTIVE" should be visible
  // and "ACTIVE" should NOT be visible
  await expect(page.locator('#inactive-indicator')).toBeVisible()
  await expect(page.locator('#active-indicator')).not.toBeVisible()

  // After toggling to true, "ACTIVE" should be visible
  await page.click('#toggle')
  await expect(page.locator('#active-indicator')).toBeVisible()
  await expect(page.locator('#inactive-indicator')).not.toBeVisible()

  // Toggle back to false
  await page.click('#toggle')
  await expect(page.locator('#inactive-indicator')).toBeVisible()
  await expect(page.locator('#active-indicator')).not.toBeVisible()
})

test('boolean :prop binding — label prop still works', async ({ page }) => {
  await page.goto('/bool-prop.html')

  await expect(page.locator('x-bool-parent')).toBeVisible()
  await expect(page.locator('#label')).toHaveText('Hello')
})
