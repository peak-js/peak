import { test, expect } from '@playwright/test';

test('x-model with text input', async ({ page }) => {
  await page.goto('/form.html');

  const textInput = page.locator('input[type="text"]');
  await expect(textInput).toHaveValue('ducks');

  await textInput.fill('cats');
  await expect(textInput).toHaveValue('cats');
});

test('x-model with radio buttons', async ({ page }) => {
  await page.goto('/form.html');

  const redRadio = page.locator('input[type="radio"][value="red"]');
  const greenRadio = page.locator('input[type="radio"][value="green"]');
  const blueRadio = page.locator('input[type="radio"][value="blue"]');

  await expect(redRadio).toBeChecked();
  await expect(greenRadio).not.toBeChecked();
  await expect(blueRadio).not.toBeChecked();

  await greenRadio.check();
  await expect(redRadio).not.toBeChecked();
  await expect(greenRadio).toBeChecked();
  await expect(blueRadio).not.toBeChecked();
});

test('x-model with select dropdown', async ({ page }) => {
  await page.goto('/form.html');

  const select = page.locator('select');
  await expect(select).toHaveValue('tokyo');

  await select.selectOption('paris');
  await expect(select).toHaveValue('paris');

  await select.selectOption('berlin');
  await expect(select).toHaveValue('berlin');
});

test('x-model with checkboxes', async ({ page }) => {
  await page.goto('/form.html');

  const invertCheckbox = page.locator('input[type="checkbox"][x-model="invert"]');
  const limitCheckbox = page.locator('input[type="checkbox"][x-model="limit"]');

  await expect(invertCheckbox).toBeChecked();
  await expect(limitCheckbox).toBeChecked();

  await invertCheckbox.uncheck();
  await expect(invertCheckbox).not.toBeChecked();
  await expect(limitCheckbox).toBeChecked();

  await limitCheckbox.uncheck();
  await expect(limitCheckbox).not.toBeChecked();
});

test('x-model two-way binding with reactive updates', async ({ page }) => {
  await page.goto('/form.html');

  const textInput = page.locator('input[type="text"]');
  const clearButton = page.locator('button:has-text("Clear")');

  await expect(textInput).toHaveValue('ducks');

  await clearButton.click();
  await expect(textInput).toHaveValue('');

  await textInput.fill('new query');
  await expect(textInput).toHaveValue('new query');
});

test('x-model with toggle all functionality', async ({ page }) => {
  await page.goto('/form.html');

  const invertCheckbox = page.locator('input[type="checkbox"][x-model="invert"]');
  const limitCheckbox = page.locator('input[type="checkbox"][x-model="limit"]');
  const toggleAllButton = page.locator('button:has-text("Toggle all")');

  await expect(invertCheckbox).toBeChecked();
  await expect(limitCheckbox).toBeChecked();

  await toggleAllButton.click();
  await expect(invertCheckbox).not.toBeChecked();
  await expect(limitCheckbox).not.toBeChecked();

  await toggleAllButton.click();
  await expect(invertCheckbox).toBeChecked();
  await expect(limitCheckbox).toBeChecked();
});

test('x-model console logging validation', async ({ page }) => {
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));

  await page.goto('/form.html');

  const textInput = page.locator('input[type="text"]');
  await textInput.fill('test');

  const greenRadio = page.locator('input[type="radio"][value="green"]');
  await greenRadio.check();

  const select = page.locator('select');
  await select.selectOption('paris');

  const invertCheckbox = page.locator('input[type="checkbox"][x-model="invert"]');
  await invertCheckbox.uncheck();

  await page.waitForTimeout(100);

  expect(consoleMessages.some(msg => msg.includes('QQ test'))).toBe(true);
  expect(consoleMessages.some(msg => msg.includes('CC green'))).toBe(true);
  expect(consoleMessages.some(msg => msg.includes('YY paris'))).toBe(true);
  expect(consoleMessages.some(msg => msg.includes('VV false'))).toBe(true);
});

test('x-model preserves initial values', async ({ page }) => {
  await page.goto('/form.html');

  const textInput = page.locator('input[type="text"]');
  const redRadio = page.locator('input[type="radio"][value="red"]');
  const select = page.locator('select');
  const invertCheckbox = page.locator('input[type="checkbox"][x-model="invert"]');
  const limitCheckbox = page.locator('input[type="checkbox"][x-model="limit"]');

  await expect(textInput).toHaveValue('ducks');
  await expect(redRadio).toBeChecked();
  await expect(select).toHaveValue('tokyo');
  await expect(invertCheckbox).toBeChecked();
  await expect(limitCheckbox).toBeChecked();
});
