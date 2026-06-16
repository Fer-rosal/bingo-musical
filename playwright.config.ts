import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // run sequentially against local dev server
  retries: 1, // one retry on flaky tests
  reporter: 'list',
  use: {
    headless: true, // ALWAYS headless — no display required on server
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true, // explicit — never rely on default
        launchOptions: {
          args: [
            '--no-sandbox', // required in many Linux server environments
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // avoids /dev/shm size issues on Linux
          ],
        },
      },
    },
  ],
})
