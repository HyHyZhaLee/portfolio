import { expect, test } from '@playwright/test';

// PF-027 P8: what a visitor sees on the deployed pair. Read-only, as `.claude/rules/security.md` requires for production:
// page loads with `?notrack=1` (no page view is counted) and the reads the page makes itself; never the contact form.
const environment = process.env.LIVE_ENVIRONMENT;
const expectedVersion = process.env.LIVE_VERSION ?? '';

test('the home page renders and the API comes online', async ({ page }) => {
    await page.goto('/?notrack=1');
    await expect(page.getByTestId('home-title-heading')).toBeVisible();
    await expect(page.getByTestId('api-status-api-state')).toContainText('Online', { timeout: 120_000 });
});

test('a project deep link renders its page', async ({ page }) => {
    await page.goto('/work/scheduling-platform?notrack=1');
    await expect(page.locator('h1#case-study-title')).toBeVisible();
    await expect(page).not.toHaveTitle(/Page not found/);
});

test('the header shows the version this deploy built', async ({ page }) => {
    test.skip(expectedVersion === '', 'LIVE_VERSION is not set');
    await page.goto('/?notrack=1');
    await expect(page.getByTestId('header-version')).toHaveText(expectedVersion);
});

test('staging shows the badge and is not indexed', async ({ page, request }) => {
    test.skip(environment !== 'staging', 'staging only');
    await page.goto('/?notrack=1');
    await expect(page.getByTestId('app-staging-badge-region')).toBeVisible();
    const response = await request.get('/');
    expect(response.headers()['x-robots-tag'] ?? '').toContain('noindex');
});

test('production shows no staging badge', async ({ page }) => {
    test.skip(environment !== 'production', 'production only');
    await page.goto('/?notrack=1');
    await expect(page.getByTestId('home-title-heading')).toBeVisible();
    await expect(page.getByTestId('app-staging-badge-region')).toHaveCount(0);
});
