const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'https://localhost:8000',
    headless: true,
  },
  projects: [
    { name: 'firefox', ...devices['Desktop Firefox'] },
  ],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
});
