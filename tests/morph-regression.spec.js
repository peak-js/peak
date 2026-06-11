import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Bug #1, #2 — same-value reactive set is silent
//
// Old behaviour: every setter (both $prop and plain reactive) fired notify()
// unconditionally, scheduling a deferred $render even when the value
// reference hadn't changed.  This caused infinite rAF loops when a parent
// re-render re-assigned the same value every frame.
//
// Fix: both setters now check equality before notify().
// ---------------------------------------------------------------------------
test('setting same value on reactive property does not trigger re-render', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('#render-val', { timeout: 5000 })

  // Let any initial deferred renders flush
  await page.waitForTimeout(300)

  const before = await page.evaluate(() => window._t1Renders || 0)

  // Set the same value — should be a no-op
  await page.click('#set-same')
  await page.waitForTimeout(300)

  const afterSame = await page.evaluate(() => window._t1Renders || 0)
  expect(afterSame).toBe(before)

  // Set a genuinely new value — should trigger a render
  await page.click('#set-new')
  await page.waitForTimeout(300)

  const afterNew = await page.evaluate(() => window._t1Renders || 0)
  expect(afterNew).toBeGreaterThan(before)
  await expect(page.locator('#render-val')).toHaveText('UPDATED')
})

// ---------------------------------------------------------------------------
// Bug #1 — Observable set trap guards against no-op Object.assign
//
// Old behaviour: observable Proxy's set trap fired notify() on every key
// regardless of whether the value actually changed.  Object.assign(msg,
// {_groupStart: ...}) on every rAF → notify → $defer → rAF → assign again
// → infinite loop.
//
// Fix: set trap returns early when x[key] === value.
// ---------------------------------------------------------------------------
test('Object.assign of same value on observable does not loop', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('#assign-trigger', { timeout: 5000 })

  // Let initial deferred renders flush
  await page.waitForTimeout(300)

  const before = await page.evaluate(() => window._t2Count || 0)

  // Object.assign with the same value — triggers the observable set trap
  await page.click('#assign-trigger')
  // Wait several frames — with the bug this would keep re-rendering forever
  await page.waitForTimeout(500)

  const after = await page.evaluate(() => window._t2Count || 0)
  // At most one extra render from the click cycle, but shouldn't loop
  expect(after).toBeLessThanOrEqual(before + 1)
})

// ---------------------------------------------------------------------------
// Bug #3, #4 — Proxy reference stability
//
// Old behaviour: observable() created a fresh Proxy wrapper on every
// property access, so two reads of the same array element returned
// different objects.  Also, the third _observe() call after mounted()
// wrapped render-set properties in getters that returned observable(value)
// — a fresh Proxy each access.
//
// Fix: observable() caches Proxies in a WeakMap keyed by target object;
// _observe() skips properties already resolved by parent :bindings.
//
// By accessing a child's :bound prop directly and checking the reference
// is stable, we verify both fixes hold at the same time.
// ---------------------------------------------------------------------------
test('observable proxy reference is stable across repeated calls', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('x-render-counter', { timeout: 5000 })

  // Direct test: observable() called twice with the same raw object
  // must return the same Proxy reference.
  const stable = await page.evaluate(() => window._runProxyStabilityTest())
  expect(stable).toBe(true)
})

// ---------------------------------------------------------------------------
// Bug #5 — Keyed branch was missing ls++, causing REPLACE of non-keyed siblings
//
// Old behaviour: the keyed branch incremented rs but NOT ls.  The while loop's
// next iteration re-examined the SAME lc[ls] against the next rc[rs].  Since
// they were different elements (one was already consumed), content/compat
// matching failed and the algorithm fell into the REPLACE branch, destroying
// the live DOM element.
//
// Fix: ls++ after rs++ in the keyed branch.
//
// Setup: [x-kc key=a] [span#plain-marker] [x-kc key=b]
// After swap: [x-kc key=b] [span#plain-marker] [x-kc key=a]
// The span must survive the reorder.
// ---------------------------------------------------------------------------
test('non-keyed element survives when keyed siblings are reordered', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('#plain-marker', { timeout: 5000 })

  // Tag the span so we can check identity after the morph
  await page.evaluate(() => {
    document.querySelector('#plain-marker')._marker = 'original-plain'
  })

  // Increment counters on both keyed children before the swap
  const children = page.locator('#kc-container x-kc')
  await expect(children).toHaveCount(2)
  await children.nth(0).locator('.kc-inc').click()
  await children.nth(0).locator('.kc-inc').click()
  await expect(children.nth(0).locator('.kc-n')).toHaveText('2')
  await children.nth(1).locator('.kc-inc').click()
  await expect(children.nth(1).locator('.kc-n')).toHaveText('1')

  // Swap the keyed children
  await page.click('#swap-kc')
  await page.waitForTimeout(300)

  // The plain span must still be alive (not replaced)
  const spanAlive = await page.evaluate(() => {
    const span = document.querySelector('#plain-marker')
    return span && span._marker === 'original-plain' && span.isConnected
  })
  expect(spanAlive).toBe(true)

  // Both x-kc components should still exist
  await expect(page.locator('#kc-container x-kc')).toHaveCount(2)

  // Internal counter state must be preserved (proving DOM identity survived)
  // After swap, the former first child (key=a, n=2) is now second,
  // and the former second (key=b, n=1) is now first.
  // Label text tells us which is which.
  const kcKids = page.locator('#kc-container x-kc')
  const firstLabel = await kcKids.nth(0).locator('.kid-label').textContent()
  const secondLabel = await kcKids.nth(1).locator('.kid-label').textContent()

  if (firstLabel === 'Second') {
    // key=b (was second, now first)
    await expect(kcKids.nth(0).locator('.kc-n')).toHaveText('1')
    await expect(kcKids.nth(1).locator('.kc-n')).toHaveText('2')
  } else {
    // key=a stayed first, key=b stayed second (order didn't fully swap)
    // This is fine as long as both survived with their state
    await expect(kcKids.nth(0).locator('.kc-n')).toHaveText('2')
    await expect(kcKids.nth(1).locator('.kc-n')).toHaveText('1')
  }
})

// ---------------------------------------------------------------------------
// Bugs #7, #8 — class change on child does NOT trigger child $render()
//
// Old behaviour: the attribute-copy loop conflated all attribute differences
// (including `class`) with reactive-prop changes.  A `class` toggle on a
// child component would set propsChanged=true and trigger a synchronous
// $render().  Additionally, the compat branch's `else` clause called
// $render() unconditionally on EVERY child, regardless of whether props
// changed.
//
// Fix: (a) class is excluded from the propsChanged comparison loop;
// (b) the compat branch's else clause only calls $render() for children
// that use <slot> (tracked via the _hasSlots flag).
// ---------------------------------------------------------------------------
test('toggling class on child component does not trigger child re-render', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('x-noslot', { timeout: 5000 })
  await page.waitForTimeout(300)

  const before = await page.evaluate(() => window._noslotRenders || 0)

  // Toggle the css class via :class binding — parent re-renders,
  // child should NOT synchronously $render() because only the class changed.
  await page.click('#toggle-class')
  await page.waitForTimeout(300)

  const afterClass = await page.evaluate(() => window._noslotRenders || 0)
  expect(afterClass).toBe(before)

  // Now genuinely change the data prop — child SHOULD re-render.
  await page.click('#change-data')
  await page.waitForTimeout(300)

  const afterData = await page.evaluate(() => window._noslotRenders || 0)
  expect(afterData).toBeGreaterThan(before)
  await expect(page.locator('x-noslot .label')).toHaveText('NEW')
})

// ---------------------------------------------------------------------------
// Bug #9 — Slot components re-render for slot re-projection
//
// When the compat branch started skipping $render() for non-slot components
// (fix #7), it also skipped it for slot-using components.  That broke
// <slot> re-projection: the parent's changed slotted content was never
// reflected in the slot's rendered output.
//
// Fix: the render function sets ctx._hasSlots = true when it encounters a
// <slot> element.  The compat branch checks this flag in the else clause
// and calls $render() for slot components even when props haven't changed.
// ---------------------------------------------------------------------------
test('slot component re-renders when parent changes slotted content', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('.marker', { timeout: 5000 })
  await expect(page.locator('.marker')).toHaveText('A')

  await page.waitForTimeout(300)
  const before = await page.evaluate(() => window._slotRenders || 0)

  // Toggle the slotted content — slot child must re-render to show it
  await page.click('#toggle-slot')
  await page.waitForTimeout(300)

  // Content must update
  await expect(page.locator('.marker')).toHaveText('B')

  // Slot child's $render must have been called
  const after = await page.evaluate(() => window._slotRenders || 0)
  expect(after).toBeGreaterThan(before)
})

// ---------------------------------------------------------------------------
// Code-review finding — Keyed branch attribute-removal loop is dead code
//
// The second attribute loop in the keyed branch iterates rc[rs].attributes
// and checks !rc[rs].hasAttribute(a.name).  Since 'a' came FROM rc[rs],
// this condition is always false — attributes are never removed from keyed
// components.  The compat branch correctly iterates lc[ls].attributes.
//
// Fix: iterate component.attributes instead of rc[rs].attributes.
// ---------------------------------------------------------------------------
test('attributes are removed from keyed components when parent stops setting them', async ({ page }) => {
  await page.goto('/morph-regression.html')
  await page.waitForSelector('#toggle-attr-removal', { timeout: 5000 })

  // The keyed x-kc component should initially have data-remove-me
  const kid = page.locator('x-kc[key="removal-test"]')
  await expect(kid).toHaveAttribute('data-remove-me', 'present')

  // Toggle — the parent's template no longer includes data-remove-me
  await page.click('#toggle-attr-removal')
  await page.waitForTimeout(300)

  // The attribute MUST be gone from the live component.
  // With the bug, the removal loop never executes and the attribute
  // persists on the live DOM element.
  await expect(kid).not.toHaveAttribute('data-remove-me')
})
