import { test, expect } from '@playwright/test'

// x-child-mounted uses mounted() to set this.status = 'mounted' after a
// short async delay.  the child is always present in the parent's template,
// but its component definition (customElements.define) is intentionally
// delayed so the parent renders and inserts <x-child-mounted> into the DOM
// before the browser knows what it is.  the browser should upgrade the
// element once it is defined and fire connectedCallback -> mounted().
//
// expected behaviour: mounted() fires after the delayed define, and the
// status text updates to 'mounted'.
//
// observed behaviour in firefox: mounted() does not fire for elements that
// were already in the DOM at the time customElements.define is called,
// so the status stays as 'initialized'.

test('mounted() fires when child component is defined after parent renders', async ({ page }) => {
  await page.goto('/mounted-child.html')

  await expect(page.locator('x-child-mounted [data-testid="child-status"]')).toBeVisible()
  await expect(page.locator('x-child-mounted [data-testid="child-status"]')).toHaveText('mounted')
})

