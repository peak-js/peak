import { test, expect } from '@playwright/test';

test('slots functionality', async ({ page }) => {
  await page.goto('/slots.html#/slots.html');
  await expect(page.locator('x-echo')).toBeVisible();
  await expect(page.locator('text=HELLO')).toBeVisible();
  await expect(page.locator('h1', { hasText: 'default content' })).toBeVisible();
  await expect(page.locator('text=BEFOREHAND!')).toBeVisible();
  await expect(page.locator('text=AFTERWARD?')).toBeVisible();
  await expect(page.locator('slot')).toHaveCount(0);
  const xEcho = page.locator('x-echo');
  await expect(xEcho.locator('text=BEFOREHAND!')).toBeVisible();
  await expect(xEcho.locator('text=AFTERWARD?')).toBeVisible();
  await expect(xEcho.locator('h1', { hasText: 'default content' })).toBeVisible();
});

test('slots content ordering', async ({ page }) => {
  await page.goto('/slots.html#/slots.html');
  await expect(page.locator('x-echo')).toBeVisible();
  const text = await page.locator('x-echo').textContent();
  expect(text.indexOf('HELLO')).toBeLessThan(text.indexOf('BEFOREHAND!'));
  expect(text.indexOf('BEFOREHAND!')).toBeLessThan(text.indexOf('default content'));
  expect(text.indexOf('default content')).toBeLessThan(text.indexOf('AFTERWARD?'));
});

test('slot rendering structure', async ({ page }) => {
  await page.goto('/slots.html#/slots.html');
  await expect(page.locator('x-echo')).toBeVisible();
  const xEcho = page.locator('x-echo');
  await expect(xEcho).toContainText('HELLO');
  await expect(xEcho).toContainText('BEFOREHAND!');
  await expect(xEcho).toContainText('default content');
  await expect(xEcho).toContainText('AFTERWARD?');
  await expect(xEcho.locator('h1')).toHaveCount(2); // One for message, one for default content
});
