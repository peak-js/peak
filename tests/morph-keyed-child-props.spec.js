import { test, expect } from '@playwright/test'

test('keyed child props transfer when parent re-renders via template x-for', async ({ page }) => {
  await page.goto('/morph-keyed-child-props.html')

  // Wait for components to render
  await page.waitForSelector('x-keyed-child')
  const children = page.locator('x-keyed-child')
  await expect(children).toHaveCount(3)

  // Verify initial labels
  await expect(children.nth(0).locator('.label')).toHaveText('alpha')
  await expect(children.nth(1).locator('.label')).toHaveText('beta')
  await expect(children.nth(2).locator('.label')).toHaveText('gamma')

  // --- Test 1: local state survives parent re-render ---
  // Increment the counter on the first child
  await children.nth(0).locator('.inc').click()
  await children.nth(0).locator('.inc').click()
  await expect(children.nth(0).locator('.count')).toHaveText('2')

  // Update a label (triggers parent $render → <template x-for> re-evaluates)
  await page.click('#update-label')

  // First child's label should reflect the update
  await expect(children.nth(0).locator('.label')).toHaveText('UPDATED')

  // Other children unchanged
  await expect(children.nth(1).locator('.label')).toHaveText('beta')
  await expect(children.nth(2).locator('.label')).toHaveText('gamma')

  // Counter state MUST survive the re-render (this is what the morph fix protects)
  await expect(children.nth(0).locator('.count')).toHaveText('2')

  // --- Test 2: new property appears on existing child ---
  // No extra span visible yet
  await expect(children.nth(0).locator('.extra')).not.toBeVisible()

  // Add a new property to the first item
  await page.click('#add-extra')

  // Label still updated
  await expect(children.nth(0).locator('.label')).toHaveText('UPDATED')

  // Extra span should now be visible with the new property
  await expect(children.nth(0).locator('.extra')).toBeVisible()
  await expect(children.nth(0).locator('.extra')).toHaveText('EXTRA')

  // Other children should NOT have the extra span
  await expect(children.nth(1).locator('.extra')).not.toBeVisible()
  await expect(children.nth(2).locator('.extra')).not.toBeVisible()

  // Counter state MUST still survive
  await expect(children.nth(0).locator('.count')).toHaveText('2')
})
