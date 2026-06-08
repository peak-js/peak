import { test, expect } from '@playwright/test';

test('100 keyed children: no synchronous child renders on no-op parent re-render', async ({ page }) => {
  await page.goto('/perf-no-unnecessary-renders.html');
  await page.waitForSelector('x-perf-child');
  await page.waitForFunction(() => window._perfRenderCount >= 100);

  // Perform the no-op render and read the count atomically so
  // only synchronous $render() calls inside morph are counted.
  const result = await page.evaluate(() => {
    const before = window._perfRenderCount;
    document.querySelector('#noop-render').click();
    const after = window._perfRenderCount;
    return { before, after };
  });

  // With the $[obj] content-match fast path, no child should need
  // a synchronous $render() when data hasn't changed.
  expect(result.after).toBe(result.before);
});

test('100 keyed children: only new child renders synchronously on add', async ({ page }) => {
  await page.goto('/perf-no-unnecessary-renders.html');
  await page.waitForSelector('x-perf-child');
  await page.waitForFunction(() => window._perfRenderCount >= 100);

  const result = await page.evaluate(() => {
    const before = window._perfRenderCount;
    document.querySelector('#add-item').click();
    const after = window._perfRenderCount;
    return { before, after };
  });

  // The new child's connectedCallback is async (microtask), and existing
  // children take the content-match fast path (no synchronous $render).
  expect(result.after).toBe(result.before);

  // The new child exists in the DOM after morph inserts it.
  await expect(page.locator('x-perf-child')).toHaveCount(101);
});

test('100 keyed children: data update propagates via deferred render', async ({ page }) => {
  await page.goto('/perf-no-unnecessary-renders.html');
  await page.waitForSelector('x-perf-child');
  await page.waitForFunction(() => window._perfRenderCount >= 100);

  const syncResult = await page.evaluate(() => {
    const before = window._perfRenderCount;
    document.querySelector('#update-first').click();
    const after = window._perfRenderCount;
    return { before, after };
  });

  // Even the changed child goes through content-match fast path
  // (same key, $[obj] constant).  No synchronous renders.
  expect(syncResult.after).toBe(syncResult.before);

  // But the child DID receive new data via the prop copy in the
  // content-match path.  The deferred render picks it up.
  await expect(page.locator('x-perf-child').first().locator('.label')).toHaveText('UPDATED');
});
