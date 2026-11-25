import { defineConfig, devices } from '@playwright/test';

// The live smoke test (PF-027 P8): runs after each deploy against the deployed site, with no local web server.
// `LIVE_SITE_URL=https://… LIVE_ENVIRONMENT=staging|production [LIVE_VERSION=v1.0.0] pnpm test:live`
const baseURL = process.env.LIVE_SITE_URL;
const environment = process.env.LIVE_ENVIRONMENT;
if (!baseURL) {
    throw new Error('LIVE_SITE_URL is required, for example https://will-ly-portfolio-staging.vercel.app');
}
if (environment !== 'staging' && environment !== 'production') {
    throw new Error('LIVE_ENVIRONMENT must be staging or production');
}

export default defineConfig({
    testDir: './e2e-live',
    // Inside node_modules so Prettier, ESLint, and git ignore the traces.
    outputDir: './node_modules/.tmp/test-results-live',
    forbidOnly: !!process.env.CI,
    retries: 1,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    // A sleeping Render service takes about 80 s to answer (PF-023).
    timeout: 180_000,
    use: { testIdAttribute: 'data-test-id', baseURL, trace: 'retain-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
