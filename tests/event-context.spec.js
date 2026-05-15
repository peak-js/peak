import { test, expect } from '@playwright/test';

test('event handler on a Peak element resolves to the parent component', async ({ page }) => {
  await page.goto('/self-event.html')

  // before emit, the parent hasn't received anything
  await expect(page.locator('[data-testid="result"]')).toHaveText('none')

  // click the button inside x-self-emitter, which emits 'pang' on itself
  await page.locator('[data-testid="emit-self"]').click()

  // the parent's onPang should have received the event
  await expect(page.locator('[data-testid="result"]')).toHaveText('from-self')
})
