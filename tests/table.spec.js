import { test, expect } from '@playwright/test';

test('table row component', async ({ page }) => {
  await page.goto('/table.html')

  await expect(page.locator('table tr')).toHaveCount(4);
  await expect(page.locator('table tr:first-child td')).toHaveCount(2);
  await expect(page.locator('table tr:first-child td').first()).toContainText('col1');
  await expect(page.locator('table tr:first-child td').last()).toContainText('col2');
  await expect(page.locator('tr[is="x-table-row"]')).toHaveCount(3);
  await expect(page.locator('table tr:last-child td[is="x-table-cell"]')).toHaveCount(1);
  await expect(page.locator('table tr:last-child td[is="x-table-cell"] strong')).toHaveText('cell content');
});
