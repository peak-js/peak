const { test, expect } = require('@playwright/test');

test('morph text', async ({ page }) => {
  await page.goto('/morph.html')
  const $text = await page.locator('[id="$text"]')
  await expect($text).toHaveText('Initial text')
  await page.click('text=Change text')
  await expect($text).toHaveText('Updated text')
})

test('morph attributes', async ({ page }) => {
  await page.goto('/morph.html')
  const $attr = await page.locator('[id="$attr"]')
  await expect($attr).toHaveAttribute('data-test', 'initial')
  await expect($attr).toHaveClass('test-class')
  await page.click('text=Change attributes')
  await expect($attr).toHaveAttribute('data-test', 'updated')
  await expect($attr).not.toHaveClass('test-class')
  await expect($attr).toHaveClass('new-class')
})

test('morph boolean attributes', async ({ page }) => {
  await page.goto('/morph.html')
  const $bool = await page.locator('[id="$bool"]')
  await expect($bool).toBeChecked()
  await page.click('text=Toggle checkbox')
  await expect($bool).not.toBeChecked()
  await page.click('text=Toggle checkbox')
  await expect($bool).toBeChecked()
});

test('morph adding elements', async ({ page }) => {
  await page.goto('/morph.html')
  const $grow = await page.locator('[id="$grow"] li')
  await expect($grow).toHaveCount(2)
  await page.click('text=Add item')
  const $item = await page.locator('[id="$grow"] li:nth-child(3):has-text("Item 3")')
  await expect($item).toBeVisible()
});

test('morph removing elements', async ({ page }) => {
  await page.goto('/morph.html')
  await expect(page.locator('[id="$prune"] li')).toHaveCount(3)
  await page.click('text=Remove item')
  await expect(page.locator('[id="$prune"] li')).toHaveCount(2)
  await expect(page.locator('[id="$prune"] li').nth(0)).toHaveText('Item 1')
  await expect(page.locator('[id="$prune"] li').nth(1)).toHaveText('Item 3')
});

test('morph reordering with keys', async ({ page }) => {
  await page.goto('/morph.html')
  await expect(page.locator('[id="$scramble"] li')).toHaveCount(3)
  await page.click('text=Scramble order')
  await expect(page.locator('[id="$scramble"] li')).toHaveCount(3)
  await expect(page.locator('[id="$scramble"] li').nth(0)).toHaveText('Item 3')
  await expect(page.locator('[id="$scramble"] li').nth(1)).toHaveText('Item 1')
  await expect(page.locator('[id="$scramble"] li').nth(2)).toHaveText('Item 2')
});
