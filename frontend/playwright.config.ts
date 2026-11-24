import { defineConfig, devices } from '@playwright/test';

// The smoke suite runs against the production build served by `vite preview`, with every API call intercepted.
const port = 4174;
// CI runs Chromium only. `E2E_ALL_BROWSERS=1 pnpm test:e2e` adds Firefox and WebKit (`pnpm exec playwright install firefox webkit` once).
const allBrowsers = process.env.E2E_ALL_BROWSERS === '1';

export default defineConfig({
    testDir: './e2e',
    // Inside node_modules so Prettier, ESLint, and git ignore the traces.
    outputDir: './node_modules/.tmp/test-results',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: { testIdAttribute: 'data-test-id', baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        ...(allBrowsers
            ? [
                  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
                  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
              ]
            : []),
    ],
    webServer: {
        command: `pnpm exec vite preview --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
    },
});
