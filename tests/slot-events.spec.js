import { test, expect } from '@playwright/test'

test('event handlers work on slotted content', async ({ page }) => {
  await page.goto('/slot-events.html#/slot-events.html')

  // Initially, result should show 'no'
  await expect(page.locator('[data-testid="result"]')).toHaveText('no')

  // Click the slotted button
  await page.locator('[data-testid="slotted-btn"]').click()

  // After click, result should show 'yes'
  await expect(page.locator('[data-testid="result"]')).toHaveText('yes')
})
