import { test, expect } from '@playwright/test'

test('unkeyed child gets updated :expr props on parent re-render', async ({ page }) => {
  await page.goto('/morph-unkeyed-child-props.html')

  // Wait for the child to render
  const child = page.locator('x-unkeyed-child')
  await expect(child).toBeVisible()

  // Initial accent should be 'red' (from parent's initial color)
  await expect(child.locator('.accent')).toHaveText('red')

  // --- Test: :expr prop survives parent re-render (the MORPH fix) ---
  // Change parent color to blue
  await page.click('#set-blue')
  await expect(child.locator('.accent')).toHaveText('blue')

  // Change to green
  await page.click('#set-green')
  await expect(child.locator('.accent')).toHaveText('green')

  // Change back to red
  await page.click('#set-red')
  await expect(child.locator('.accent')).toHaveText('red')
})

test('unkeyed child preserves internal state across parent re-renders', async ({ page }) => {
  await page.goto('/morph-unkeyed-child-props.html')

  const child = page.locator('x-unkeyed-child')
  await expect(child).toBeVisible()

  // Increment the child's internal counter a few times
  await child.locator('.inc-btn').click()
  await child.locator('.inc-btn').click()
  await child.locator('.inc-btn').click()
  await expect(child.locator('.count')).toHaveText('3')

  // Trigger a parent re-render by changing the color
  await page.click('#set-blue')

  // The counter must survive — the same component instance was re-used
  await expect(child.locator('.count')).toHaveText('3')

  // The prop update must also have taken effect
  await expect(child.locator('.accent')).toHaveText('blue')
})

test('unkeyed child survives multiple parent re-renders with state intact', async ({ page }) => {
  await page.goto('/morph-unkeyed-child-props.html')

  const child = page.locator('x-unkeyed-child')
  await expect(child).toBeVisible()

  // Initial
  await expect(child.locator('.accent')).toHaveText('red')

  // Increment counter to 2
  await child.locator('.inc-btn').click()
  await child.locator('.inc-btn').click()
  await expect(child.locator('.count')).toHaveText('2')

  // Re-render: red → blue
  await page.click('#set-blue')
  await expect(child.locator('.accent')).toHaveText('blue')
  await expect(child.locator('.count')).toHaveText('2')

  // Increment to 4
  await child.locator('.inc-btn').click()
  await child.locator('.inc-btn').click()
  await expect(child.locator('.count')).toHaveText('4')

  // Re-render: blue → green
  await page.click('#set-green')
  await expect(child.locator('.accent')).toHaveText('green')
  await expect(child.locator('.count')).toHaveText('4')

  // Increment to 7
  await child.locator('.inc-btn').click()
  await child.locator('.inc-btn').click()
  await child.locator('.inc-btn').click()
  await expect(child.locator('.count')).toHaveText('7')

  // Re-render: green → red
  await page.click('#set-red')
  await expect(child.locator('.accent')).toHaveText('red')
  await expect(child.locator('.count')).toHaveText('7')
})
