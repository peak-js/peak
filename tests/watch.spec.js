const { test, expect } = require('@playwright/test');

test('$watch basic property changes', async ({ page }) => {
  await page.goto('/watch.html')
  
  // initial state
  await expect(page.locator('[data-testid="watch-log"]')).toContainText('No changes yet')
  await expect(page.locator('[data-testid="increment-btn"] span')).toContainText('0')
  
  // click to increment count
  await page.locator('[data-testid="increment-btn"]').click()
  
  // verify watch handler was called
  await expect(page.locator('[data-testid="watch-log"]')).toContainText('Count changed to: 1')
  await expect(page.locator('[data-testid="increment-btn"] span')).toContainText('1')
  
  // click again
  await page.locator('[data-testid="increment-btn"]').click()
  await expect(page.locator('[data-testid="watch-log"]')).toContainText('Count changed to: 2')
  await expect(page.locator('[data-testid="increment-btn"] span')).toContainText('2')
})

test('$watch computed property changes', async ({ page }) => {
  await page.goto('/watch.html')
  
  // initial state
  await expect(page.locator('[data-testid="computed-log"]')).toContainText('No computed changes yet')
  await expect(page.locator('[data-testid="toggle-flag"] span')).toContainText('false')
  
  // toggle flag to trigger computed property change
  await page.locator('[data-testid="toggle-flag"]').click()
  
  // verify watch handler was called for computed property
  await expect(page.locator('[data-testid="computed-log"]')).toContainText('Computed changed to: TRUE')
  await expect(page.locator('[data-testid="toggle-flag"] span')).toContainText('true')
  
  // toggle back
  await page.locator('[data-testid="toggle-flag"]').click()
  await expect(page.locator('[data-testid="computed-log"]')).toContainText('Computed changed to: FALSE')
  await expect(page.locator('[data-testid="toggle-flag"] span')).toContainText('false')
})

test('$watch object property changes', async ({ page }) => {
  await page.goto('/watch.html')
  
  // initial state
  await expect(page.locator('[data-testid="user-log"]')).toContainText('No user changes yet')
  await expect(page.locator('[data-testid="user-display"]')).toContainText('John')
  
  // update user to trigger object property watch
  await page.locator('[data-testid="update-user"]').click()
  
  // verify watch handler was called for object property
  await expect(page.locator('[data-testid="user-log"]')).toContainText('User name changed to: Jane')
  await expect(page.locator('[data-testid="user-display"]')).toContainText('Jane')
})

test('$watch multiple watchers on same property', async ({ page }) => {
  await page.goto('/watch.html')
  
  // initial state
  await expect(page.locator('[data-testid="watch1-log"]')).toContainText('Watch1: No changes')
  await expect(page.locator('[data-testid="watch2-log"]')).toContainText('Watch2: No changes')
  await expect(page.locator('[data-testid="change-title"] span')).toContainText('Initial Title')
  
  // change title to trigger both watchers
  await page.locator('[data-testid="change-title"]').click()
  
  // verify both watch handlers were called
  await expect(page.locator('[data-testid="watch1-log"]')).toContainText('Watch1: Title is now Changed!')
  await expect(page.locator('[data-testid="watch2-log"]')).toContainText('Watch2: Title changed to Changed!')
  await expect(page.locator('[data-testid="change-title"] span')).toContainText('Changed!')
})

