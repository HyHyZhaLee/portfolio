import { expect, test } from '@playwright/test';

// Non-Negotiable 1: every page works with the API unreachable. No backend runs here; every API call is refused.
test.beforeEach(async ({ page }) => {
    await page.route(/\/(api|actuator)\//, (route) => route.abort('connectionrefused'));
});

const sections = ['about', 'work', 'how-i-work', 'skills', 'experience', 'open-source', 'education', 'contact'];

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
