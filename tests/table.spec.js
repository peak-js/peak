import { test, expect } from '@playwright/test';

test('table row component', async ({ page }) => {
  await page.goto('/table.html')

  await expect(page.locator('table tr')).toHaveCount(6);
  await expect(page.locator('table tr:first-child td')).toHaveCount(2);
  await expect(page.locator('table tr:first-child td').first()).toContainText('col1');
  await expect(page.locator('table tr:first-child td').last()).toContainText('col2');
  await expect(page.locator('tr[is="x-table-row"]')).toHaveCount(3);
  await expect(page.locator('table tr:nth-child(4) td[is="x-table-cell"]')).toHaveCount(1);
  await expect(page.locator('table tr:nth-child(4) td[is="x-table-cell"] strong')).toHaveText('cell content');
});

test('table row component preserves content after re-render', async ({ page }) => {
  await page.goto('/table.html')

  // verify initial state
  await expect(page.locator('table tr:first-child td')).toHaveCount(2);
  await expect(page.locator('table tr:first-child td').first()).toContainText('col1');
  await expect(page.locator('table tr:first-child td').last()).toContainText('col2');

  // trigger re-render by calling $render() on the view component (child of router-view)
  await page.evaluate(() => {
    const viewComponent = document.querySelector('x-router-view').firstElementChild;
    viewComponent.$render();
  });

  // verify that td elements are still present after re-render
  await expect(page.locator('table tr:first-child td')).toHaveCount(2);
  await expect(page.locator('table tr:first-child td').first()).toContainText('col1');
  await expect(page.locator('table tr:first-child td').last()).toContainText('col2');
});
