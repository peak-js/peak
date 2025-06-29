import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
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
