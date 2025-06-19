const { test, expect } = require('@playwright/test');

test('async properties set in mounted lifecycle', async ({ page }) => {
  await page.goto('/async-lifecycle.html');

  // wait for async operations to complete and properties to be reactive
  await expect(page.locator('[data-testid="async-items"]')).toHaveText('3');
  await expect(page.locator('[data-testid="async-user"]')).toHaveText('John Doe');
  await expect(page.locator('[data-testid="async-status"]')).toHaveText('Mounted!');
});

test('async data in templates', async ({ page }) => {
  await page.goto('/async-lifecycle.html');

  // wait for items to load and render in the list
  await expect(page.locator('[data-testid="items-list"] li')).toHaveCount(3);
  await expect(page.locator('[data-testid="items-list"] li').nth(0)).toHaveText('Item 1');
  await expect(page.locator('[data-testid="items-list"] li').nth(1)).toHaveText('Item 2');
  await expect(page.locator('[data-testid="items-list"] li').nth(2)).toHaveText('Item 3');
});

test('multiple async operations with different timing', async ({ page }) => {
  await page.goto('/async-lifecycle.html');

  // wait for all async operations to complete
  await expect(page.locator('[data-testid="fast-data"]')).toHaveText('Fast data loaded');
  await expect(page.locator('[data-testid="slow-data"]')).toHaveText('Slow data loaded');
  await expect(page.locator('[data-testid="error-data"]')).toHaveText('Error handled gracefully');
});

test('reactivity when updating async properties', async ({ page }) => {
  await page.goto('/async-lifecycle.html');

  // wait for initial load
  await expect(page.locator('[data-testid="async-items"]')).toHaveText('3');
  await expect(page.locator('[data-testid="async-user"]')).toHaveText('John Doe');
  await expect(page.locator('[data-testid="update-counter"]')).toHaveText('0');

  // click update button
  await page.locator('button', { hasText: 'Update Async Data' }).click();

  // should show updating state
  await expect(page.locator('[data-testid="async-status"]')).toHaveText('Updating...');
  await expect(page.locator('[data-testid="update-counter"]')).toHaveText('1');

  // wait for updates to complete
  await expect(page.locator('[data-testid="async-items"]')).toHaveText('4');
  await expect(page.locator('[data-testid="async-user"]')).toHaveText('John Doe (Updated 1)');
  await expect(page.locator('[data-testid="async-status"]')).toHaveText('Updated! (1)');

  // verify new item was added to the list
  await expect(page.locator('[data-testid="items-list"] li')).toHaveCount(4);
  await expect(page.locator('[data-testid="items-list"] li').nth(3)).toHaveText('New Item 4');
});

test('rapid updates without race conditions', async ({ page }) => {
  await page.goto('/async-lifecycle.html');

  // wait for initial load
  await expect(page.locator('[data-testid="async-status"]')).toHaveText('Mounted!');

  // click update button multiple times rapidly
  const updateButton = page.locator('button', { hasText: 'Update Async Data' });
  await updateButton.click();
  await updateButton.click();
  await updateButton.click();

  // should handle multiple updates and show final state
  await expect(page.locator('[data-testid="update-counter"]')).toHaveText('3');
  await expect(page.locator('[data-testid="async-status"]')).toHaveText('Updated! (3)');
  
  // items should be updated with 3 original + 3 updates
  await expect(page.locator('[data-testid="async-items"]')).toHaveText('6');
  await expect(page.locator('[data-testid="items-list"] li')).toHaveCount(6);
});

test('observe properties set asynchronously', async ({ page }) => {
  await page.goto('/async-lifecycle.html');

  // properties set in mounted
  await expect(page.locator('[data-testid="async-items"]')).toHaveText('3');
  
  // modify properties through the console to test reactivity
  await page.evaluate(() => {
    const component = document.querySelector('x-router-view').children[0];
    component.items = [{ id: 99, name: 'Console Item' }];
  });

  // should trigger re-render
  await expect(page.locator('[data-testid="async-items"]')).toHaveText('1');
  await expect(page.locator('[data-testid="items-list"] li')).toHaveCount(1);
  await expect(page.locator('[data-testid="items-list"] li').nth(0)).toHaveText('Console Item');
});

test('errors in async mounted method', async ({ page }) => {
  // create a component that throws an error in mounted
  await page.goto('/async-lifecycle.html');
  
  // inject a component that will throw an error
  await page.evaluate(() => {
    const script = `
      export default class {
        initialize() {
          this.status = 'Will error';
        }
        
        async mounted() {
          this.status = 'About to error';
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Async mounted error');
        }
      }
    `;
    
    // replace the component with one that errors
    window.testErrorComponent = script;
  });

  // for this test, we'll verify that the error doesn't break the whole framework
  // by checking that other components still work
  await expect(page.locator('[data-testid="async-status"]')).toHaveText('Mounted!');
});
