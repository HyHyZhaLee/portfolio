import { expect, test, type Locator, type Page } from '@playwright/test';

// PF-015: responsive polish. Every API call is refused, as in the smoke suite, so the page renders with the backend down.
test.beforeEach(async ({ page }) => {
    await page.route(/\/(api|actuator)\//, (route) => route.abort('connectionrefused'));
});

const study = '/work/legacy-app-web-port';
const phone = { width: 375, height: 667 };
const touch = { viewport: phone, hasTouch: true, isMobile: true };

// String expressions: the e2e TypeScript config has no DOM types.
async function boxOf(locator: Locator) {
    const box = await locator.boundingBox();
    if (box === null) {
        throw new Error('element has no layout box');
    }
    return box;
}

const rootFontSize = (page: Page) => page.evaluate<string>('getComputedStyle(document.documentElement).fontSize');

// AC-1: the page never scrolls sideways; the architecture figure may scroll inside its own region (D11).
for (const width of [320, 375, 414, 768, 1024, 1366, 1920, 2560]) {
    for (const path of ['/', study]) {
        test(`no horizontal page scroll at ${width}px on ${path}`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(path);
            await expect(page.locator('h1')).toBeVisible();
            const fits = await page.evaluate<boolean>('document.documentElement.scrollWidth <= document.documentElement.clientWidth');
            expect(fits).toBe(true);
        });
    }
}

test.describe('mobile menu (AC-2)', () => {
    test.use(touch);

    test('opens, traps focus, closes on Escape, and navigates from a link', async ({ page }) => {
        await page.goto('/');
        const button = page.getByTestId('header-menu-button');
        const dialog = page.getByTestId('header-menu-dialog');

        await button.tap();
        await expect(dialog).toBeVisible();
        await expect(dialog.getByTestId('header-nav-link').first()).toBeFocused();
        await expect.poll(() => page.evaluate<string>('getComputedStyle(document.documentElement).overflow')).toBe('hidden');

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(button).toBeFocused();

        await button.tap();
        await dialog.getByTestId('header-nav-link').filter({ hasText: /work/i }).first().tap();
        await expect(dialog).toBeHidden();
        await expect(page).toHaveURL(/#work$/);
    });
});

// AC-3: the first screen holds its call to action on a phone and the whole hero on a laptop.
test('the View work link sits inside the fold at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const box = await boxOf(page.getByTestId('hero-work-link'));
    expect(box).not.toBeNull();
    expect(box.y + box.height).toBeLessThanOrEqual(844);
});

test('the hero ends inside the fold at 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    const box = await boxOf(page.locator('section:has(#hero-heading)'));
    expect(box.y + box.height).toBeLessThanOrEqual(768);
});

// AC-5: the glance details fold behind a toggle below 1024px only.
test('the glance toggle expands the details on a phone', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto(study);
    const toggle = page.getByTestId('case-study-glance-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('aside > div[id]')).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('aside > div[id]')).toBeVisible();
});

test('the glance toggle is hidden and the stack shows at 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(study);
    await expect(page.getByTestId('case-study-glance-toggle')).toBeHidden();
    await expect(page.locator('aside > div[id]')).toBeVisible();
});

// A point `dy` px above (negative) or below (positive) the element's box, at its horizontal centre, lands on the element.
async function hitsOutside(page: Page, testId: string, edge: 'top' | 'bottom') {
    const target = page.getByTestId(testId).first();
    await target.scrollIntoViewIfNeeded();
    const box = await boxOf(target);
    const x = box.x + box.width / 2;
    const y = edge === 'top' ? box.y - 4 : box.y + box.height + 4;
    return page.evaluate<boolean>(
        `(() => { const found = document.elementFromPoint(${x}, ${y}); const el = document.querySelector('[data-test-id="${testId}"]'); return found !== null && el.contains(found); })()`,
    );
}

test.describe('touch targets (AC-6)', () => {
    test.use(touch);

    test('small controls hit 4px beyond their box (44px hit areas)', async ({ page }) => {
        await page.goto('/');
        for (const testId of ['skills-skill-button', 'education-certificate-button']) {
            expect(await hitsOutside(page, testId, 'top'), `${testId} above`).toBe(true);
            expect(await hitsOutside(page, testId, 'bottom'), `${testId} below`).toBe(true);
        }
        await page.goto(study);
        expect(await hitsOutside(page, 'case-study-back-link', 'top')).toBe(true);
        expect(await hitsOutside(page, 'case-study-back-link', 'bottom')).toBe(true);
    });

    test('the menu, contact cards, and form controls are at least 44px tall', async ({ page }) => {
        await page.goto('/');
        const ids = [
            'contact-email-link',
            'contact-linkedin-link',
            'contact-github-link',
            'contact-name-input',
            'contact-email-input',
            'contact-submit-button',
        ];
        for (const testId of ['header-menu-button', ...ids]) {
            expect((await boxOf(page.getByTestId(testId))).height, testId).toBeGreaterThanOrEqual(44);
        }
        await page.getByTestId('header-menu-button').tap();
        const links = page.getByTestId('header-menu-dialog').getByTestId('header-nav-link');
        await expect(links).toHaveCount(6);
        for (const link of await links.all()) {
            expect((await boxOf(link)).height).toBeGreaterThanOrEqual(44);
        }
    });
});

// AC-8: at 1024px the content is no longer squeezed beside a heading rail.
test('the article, work rows, and About text keep their full width at 1024x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    const aboutDesktop = (await boxOf(page.locator('#about p').first())).width;
    await page.setViewportSize({ width: 1024, height: 768 });
    expect((await boxOf(page.locator('#about p').first())).width).toBeGreaterThanOrEqual(aboutDesktop - 1);
    expect((await boxOf(page.locator('#work li').first())).width).toBeGreaterThanOrEqual(576);
    await page.goto(study);
    const column = page.locator('article h2').first().locator('xpath=../..');
    expect((await boxOf(column)).width).toBeGreaterThanOrEqual(576);
});

// AC-9: a landscape phone keeps a compact header (48px plus its 1px border).
test('the header is at most 49px tall at 844x390', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    const box = await boxOf(page.locator('header').first());
    expect(box.height).toBeLessThanOrEqual(49);
});

// AC-10: wide screens scale through the root font size.
test('the root font size is 16px at 1440 and 20px at 2560', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect.poll(() => rootFontSize(page)).toBe('16px');
    await page.setViewportSize({ width: 2560, height: 1440 });
    await expect.poll(() => rootFontSize(page)).toBe('20px');
});

// AC-11: the scroll reveal never leaves content hidden or animating against the visitor's preference.
test.describe('reduced motion (AC-11a)', () => {
    test.use({ reducedMotion: 'reduce' });

    test('no scroll-driven reveal animation runs', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('home-title-heading')).toBeVisible();
        const names = await page.evaluate<string[]>('document.getAnimations().map((a) => a.animationName ?? "").filter((n) => n === "reveal")');
        expect(names).toEqual([]);
    });
});

test('a deep link to Skills leaves its heading and first group fully opaque (AC-11b)', async ({ page }) => {
    await page.goto('/#skills');
    await page.waitForLoadState('load');
    const heading = page.locator('#skills h2');
    const group = page.locator('#skills h3').first().locator('xpath=..');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('opacity', '1');
    await expect(group).toHaveCSS('opacity', '1');
});
