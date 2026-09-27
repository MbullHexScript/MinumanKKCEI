import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 2,
  reporter: 'list',
  use: {
    channel: 'chromium',
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', testMatch: 'app.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', testMatch: 'app.spec.ts', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 852 } } },
    { name: 'cloud-contract', testMatch: 'cloud.spec.ts', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4174' } },
  ],
  webServer: [
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'npm run dev -- --port 4174 --strictPort',
      url: 'http://localhost:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: { VITE_SUPABASE_URL: 'https://cei-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-public-key' },
    },
  ],
});
