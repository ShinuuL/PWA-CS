import { defineConfig, devices } from '@playwright/test'

const webServer = {
  command: 'node .\\node_modules\\vite\\bin\\vite.js --host 127.0.0.1 --port 5174 --strictPort',
  url: 'http://127.0.0.1:5174',
  reuseExistingServer: false,
  env: {
    VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY: 'test-public-key',
    VITE_VAPID_PUBLIC_KEY: '',
  },
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.js',
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5174', serviceWorkers: 'block', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
  ...(process.env.PLAYWRIGHT_EXTERNAL_SERVER === '1' ? {} : { webServer }),
})
