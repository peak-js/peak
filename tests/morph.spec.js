import { test, expect } from '@playwright/test';

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
})

test('morph adding elements', async ({ page }) => {
  await page.goto('/morph.html')
  const $grow = await page.locator('[id="$grow"] li')
  await expect($grow).toHaveCount(2)
  await page.click('text=Add item')
  const $item = await page.locator('[id="$grow"] li:nth-child(3):has-text("Item 3")')
  await expect($item).toBeVisible()
})

test('morph removing elements', async ({ page }) => {
  await page.goto('/morph.html')
  await expect(page.locator('[id="$prune"] li')).toHaveCount(3)
  await page.click('text=Remove item')
  await expect(page.locator('[id="$prune"] li')).toHaveCount(2)
  await expect(page.locator('[id="$prune"] li').nth(0)).toHaveText('Item 1')
  await expect(page.locator('[id="$prune"] li').nth(1)).toHaveText('Item 3')
})

test('morph reordering with keys', async ({ page }) => {
  await page.goto('/morph.html')
  await expect(page.locator('[id="$scramble"] li')).toHaveCount(3)
  await page.click('text=Scramble order')
  await expect(page.locator('[id="$scramble"] li')).toHaveCount(3)
  await expect(page.locator('[id="$scramble"] li').nth(0)).toHaveText('Item 3')
  await expect(page.locator('[id="$scramble"] li').nth(1)).toHaveText('Item 1')
  await expect(page.locator('[id="$scramble"] li').nth(2)).toHaveText('Item 2')
})

test('morph sibling flip flop events', async ({ page }) => {
  await page.goto('/flop.html')
  await page.click('text=DEBUG')
  await expect(page.locator('text=CLICKED!')).toBeVisible()
})

test('morph cross-hierarchy keyed component movement', async ({ page }) => {
  await page.goto('/morph.html')

  // Wait for component to load
  await page.waitForSelector('x-counter')

  // Initially counter should be in container A
  const counter = page.locator('x-counter[key="toolbar"]')
  await expect(counter).toBeVisible()
  await expect(page.locator('.container-a x-counter[key="toolbar"]')).toBeVisible()
  await expect(page.locator('.container-b x-counter[key="toolbar"]')).not.toBeVisible()

  // Click counter button to increment (this creates component state)
  await counter.locator('button').click()
  await expect(counter).toContainText('Counter: 1')

  // Click again to make sure state is accumulating
  await counter.locator('button').click()
  await expect(counter).toContainText('Counter: 2')

  // Move counter component to container B
  await page.click('text=Move toolbar')

  // Counter should now be in container B AND preserve its internal state
  // This proves the same Peak component instance was reused rather than recreated
  await expect(page.locator('.container-a x-counter[key="toolbar"]')).not.toBeVisible()
  await expect(page.locator('.container-b x-counter[key="toolbar"]')).toBeVisible()
  await expect(page.locator('.container-b x-counter[key="toolbar"]')).toContainText('Counter: 2')

  // Test that reactivity still works after the move
  const movedCounter = page.locator('.container-b x-counter[key="toolbar"]')
  await movedCounter.locator('button').click()
  await expect(movedCounter).toContainText('Counter: 3')
  await movedCounter.locator('button').click()
  await expect(movedCounter).toContainText('Counter: 4')
})

test('morph deeply nested keyed component lookup', async ({ page }) => {
  await page.goto('/morph.html')

  // Wait for component to load
  await page.waitForSelector('x-counter[key="deep-widget"]')

  // Initially widget should be deeply nested
  const widget = page.locator('x-counter[key="deep-widget"]')
  await expect(widget).toBeVisible()
  await expect(page.locator('.level3 x-counter[key="deep-widget"]')).toBeVisible()
  await expect(page.locator('.different-branch x-counter[key="deep-widget"]')).not.toBeVisible()

  // Click counter button to increment (this creates component state)
  await widget.locator('button').click()
  await expect(widget).toContainText('Counter: 1')

  // Click again to make sure state is accumulating
  await widget.locator('button').click()
  await expect(widget).toContainText('Counter: 2')

  // Move widget from deep nesting to different branch
  await page.click('text=Move deep widget')

  // Widget should now be in different branch AND preserve its internal state
  // This proves the same Peak component instance was reused rather than recreated
  await expect(page.locator('.level3 x-counter[key="deep-widget"]')).not.toBeVisible()
  await expect(page.locator('.different-branch x-counter[key="deep-widget"]')).toBeVisible()
  await expect(page.locator('.different-branch x-counter[key="deep-widget"]')).toContainText('Counter: 2')

  // Test that reactivity still works after the move
  const movedWidget = page.locator('.different-branch x-counter[key="deep-widget"]')
  await movedWidget.locator('button').click()
  await expect(movedWidget).toContainText('Counter: 3')
  await movedWidget.locator('button').click()
  await expect(movedWidget).toContainText('Counter: 4')
})

test('morph sibling keyed component movement', async ({ page }) => {
  await page.goto('/morph.html')

  // Wait for component to load
  await page.waitForSelector('x-counter[key="sibling-widget"]')

  // Initially widget should be first child
  const widget = page.locator('x-counter[key="sibling-widget"]')
  await expect(widget).toBeVisible()

  // Verify initial DOM structure - counter is first, then spacer, then target
  const siblings = page.locator('#\\$siblings > *')
  await expect(siblings.nth(0)).toHaveAttribute('key', 'sibling-widget')
  await expect(siblings.nth(1)).toHaveClass('spacer')
  await expect(siblings.nth(2)).toHaveClass('target')

  // Click counter button to increment (this creates component state)
  await widget.locator('button').click()
  await expect(widget).toContainText('Counter: 1')

  // Click again to make sure state is accumulating
  await widget.locator('button').click()
  await expect(widget).toContainText('Counter: 2')

  // Move widget to end (last sibling position)
  await page.click('text=Move to end')

  // Widget should now be last AND preserve its internal state
  // This tests the original sibling-based keyed logic still works
  await expect(siblings.nth(0)).toHaveClass('spacer')
  await expect(siblings.nth(1)).toHaveClass('target')
  await expect(siblings.nth(2)).toHaveAttribute('key', 'sibling-widget')
  await expect(siblings.nth(2)).toContainText('Counter: 2')

  // Test that reactivity still works after the move
  const movedWidget = page.locator('#\\$siblings x-counter[key="sibling-widget"]')
  await movedWidget.locator('button').click()
  await expect(movedWidget).toContainText('Counter: 3')
  await movedWidget.locator('button').click()
  await expect(movedWidget).toContainText('Counter: 4')
})
