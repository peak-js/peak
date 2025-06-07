const { test, expect } = require('@playwright/test');

test('lifecycle methods and events', async ({ page }) => {
  await page.goto('/lifecycle.html');

  await expect(page.locator('[data-testid="initialize-method-count"]')).toHaveText('1');
  await expect(page.locator('[data-testid="initialize-event-count"]')).toHaveText('1');
  await expect(page.locator('[data-testid="mounted-method-count"]')).toHaveText('1');
  await expect(page.locator('[data-testid="mounted-event-count"]')).toHaveText('1');
});

test('$on/$emit for custom events', async ({ page }) => {
  await page.goto('/lifecycle.html');

  await expect(page.locator('[data-testid="custom-event-count"]')).toHaveText('0');
  await expect(page.locator('[data-testid="multiple-events-handled"]')).toHaveText('0');

  await page.locator('button', { hasText: 'Emit Custom Event' }).click();
  await expect(page.locator('[data-testid="custom-event-count"]')).toHaveText('1');

  await page.locator('button', { hasText: 'Emit Custom Event' }).click();
  await expect(page.locator('[data-testid="custom-event-count"]')).toHaveText('2');

  await page.locator('button', { hasText: 'Emit Multiple Events' }).click();
  await expect(page.locator('[data-testid="multiple-events-handled"]')).toHaveText('3');
});

test('teardown method and event', async ({ page }) => {
  await page.goto('/lifecycle.html');

  // wait for the component to be fully initialized
  await expect(page.locator('[data-testid="initialize-method-count"]')).toHaveText('1');

  // remove the component to trigger teardown
  await page.evaluate(() => {
    window.lifecycleCounts = window.lifecycleCounts || {};
    const component = document.querySelector('x-router-view').children[0];
    if (component) component.remove();
  });

  // wait for teardown to complete
  await page.waitForFunction(() => {
    return window.lifecycleCounts.teardownMethodCount === 1 && 
           window.lifecycleCounts.teardownEventCount === 1;
  });

  // verify teardown counts
  const lifecycleCounts = await page.evaluate(() => window.lifecycleCounts);
  expect(lifecycleCounts.teardownMethodCount).toBe(1);
  expect(lifecycleCounts.teardownEventCount).toBe(1);
});
