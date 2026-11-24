import { expect, test } from '@playwright/test';

// Non-Negotiable 1: every page works with the API unreachable. No backend runs here; every API call is refused.
test.beforeEach(async ({ page }) => {
    await page.route(/\/(api|actuator)\//, (route) => route.abort('connectionrefused'));
});

const sections = ['about', 'experience', 'work', 'how-i-work', 'skills', 'education', 'contact'];

test('the home page renders every section with the API unreachable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-title-heading')).toBeVisible();
    for (const id of sections) {
        await expect(page.locator(`section#${id}`)).toBeAttached();
    }
    await expect(page.getByTestId('contact-form-region')).toBeVisible();
});

test('a case-study route renders its title', async ({ page }) => {
    await page.goto('/work/scheduling-platform');
    await expect(page.locator('h1#case-study-title')).toBeVisible();
    await expect(page).not.toHaveTitle(/Page not found/);
});

// PF-009: the build writes one HTML file per case study (vite preview serves it at the trailing-slash URL; Vercel serves both), so a link preview reads the study's own tags without running JavaScript.
test('a case-study route is served with its own title in the HTML source', async ({ request }) => {
    const html = await (await request.get('/work/scheduling-platform/')).text();
    expect(html).toMatch(/<title>[^<]*\| Will Ly<\/title>/);
    expect(html).toContain('og:title');
    expect(html).not.toContain('Full-stack Software Engineer');
});

test('an unknown case-study slug still shows the 404 page', async ({ page }) => {
    await page.goto('/work/no-such-study');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
});

test('an unknown route shows the 404 page', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveTitle(/Page not found/);
    await expect(page.getByTestId('not-found-home-link')).toBeVisible();
});

test('the contact form shows field errors for invalid input', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('contact-email-input').fill('not-an-email');
    await page.getByTestId('contact-message-input').fill('short');
    await page.getByTestId('contact-submit-button').click();
    await expect(page.getByText('Enter your name, up to 100 characters.')).toBeVisible();
    await expect(page.getByText('Enter a valid email address, up to 254 characters.')).toBeVisible();
    await expect(page.getByText('Write between 10 and 2,000 characters.')).toBeVisible();
    await expect(page.getByTestId('contact-name-input')).toHaveAttribute('aria-invalid', 'true');
});
