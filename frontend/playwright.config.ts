import { defineConfig, devices } from '@playwright/test';

// The smoke suite runs against the production build served by `vite preview`, with every API call intercepted.
const port = 4174;

export default defineConfig({
    testDir: './e2e',
    // Inside node_modules so Prettier, ESLint, and git ignore the traces.
    outputDir: './node_modules/.tmp/test-results',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: { testIdAttribute: 'data-test-id', baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: `pnpm exec vite preview --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
    },
});
