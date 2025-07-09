import { defineConfig, devices } from '@playwright/test'

const PORT = 3712

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || `http://localhost:${PORT}`,
    headless: true,
  },
  webServer: {
    command: `python -m http.server ${PORT} 2>/dev/null`,
    port: PORT,
  },
  projects: [
    { name: 'firefox', ...devices['Desktop Firefox'] },
  ],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
})
