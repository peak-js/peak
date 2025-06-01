const { test, expect } = require('@playwright/test');

test('x-text', async ({ page }) => {
  await page.goto('/x-text.html')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('text=Hello, World')).toBeVisible()
  await expect(page.locator('text=861')).toBeVisible()
  await expect(page.locator('[x-text]')).toHaveCount(0)
})

test('x-html', async ({ page }) => {
  await page.goto('/x-html.html')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('text=Greetings, Earthlings')).toBeVisible()
  await expect(page.locator('marquee')).toBeVisible()
  await expect(page.locator('[x-html]')).toHaveCount(0)
})

test('x-if', async ({ page }) => {
  await page.goto('/x-if.html')
  await expect(page.locator('text=true is true')).toBeVisible()
  await expect(page.locator('text=false is false')).toBeVisible()
  await expect(page.locator('text=one is true')).toBeVisible()
  await expect(page.locator('text=yes one')).toBeVisible()
  await expect(page.locator('text=default is default')).toBeVisible()
  await expect(page.locator('div')).toHaveCount(5)
  await expect(page.locator('li + li + li')).toBeVisible()
})

test('x-for', async ({ page }) => {
  await page.goto('/x-for.html')
  await expect(page.locator('li', { hasText: 'apple' })).toBeVisible()
  await expect(page.locator('li', { hasText: 'banana' })).toBeVisible()
  await expect(page.locator('li', { hasText: 'cherry' })).toBeVisible()

  await expect(page.locator('td', { hasText: 'pay taxes' })).toBeVisible()
  await expect(page.locator('td', { hasText: 'walk the dog' })).toBeVisible()
  await expect(page.locator('td', { hasText: 'clean the house' })).toBeVisible()

  await expect(page.locator('li', { hasText: 'red' })).toBeVisible()
  await expect(page.locator('li', { hasText: 'green' })).toBeVisible()
  await expect(page.locator('li', { hasText: 'blue' })).toBeVisible()
})

test('events', async({ page }) => {
  await page.goto('/events.html')

  // inline handler
  await expect(page.locator('[data-testid="btn0"]', { hasText: 'btn0 0' })).toBeVisible()
  await page.locator('[data-testid="btn0"]').dispatchEvent('click')
  await expect(page.locator('[data-testid="btn0"]', { hasText: 'btn0 1' })).toBeVisible()
  await page.locator('[data-testid="btn0"]').dispatchEvent('click')
  await expect(page.locator('[data-testid="btn0"]', { hasText: 'btn0 2' })).toBeVisible()

  // method with custom arg
  await expect(page.locator('[data-testid="btn1"]', { hasText: 'btn1 0' })).toBeVisible()
  await page.locator('[data-testid="btn1"]').dispatchEvent('click')
  await expect(page.locator('[data-testid="btn1"]', { hasText: 'btn1 1' })).toBeVisible()

  // stopping propagation with $event
  await expect(page.locator('[data-testid="btn2"]', { hasText: 'btn2 0' })).toBeVisible()
  await page.locator('[data-testid="btn2"]').dispatchEvent('click')
  await expect(page.locator('[data-testid="btn2"]', { hasText: 'btn2 1' })).toBeVisible()

  // bubbling
  await expect(page.locator('[data-testid="btn3"]', { hasText: 'btn3 0' })).toBeVisible()
  await page.locator('[data-testid="btn3"]').dispatchEvent('click')
  await expect(page.locator('[data-testid="btn3"]', { hasText: 'btn3 2' })).toBeVisible()

})
