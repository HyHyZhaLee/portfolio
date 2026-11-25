import { expect, test, type Page } from '@playwright/test';

// PF-026: the home page ships one script, the case study and contact form load on demand, and fonts and the portrait load once at the right size.
test.beforeEach(async ({ page }) => {
    await page.route(/\/(api|actuator)\//, (route) => route.abort('connectionrefused'));
});

function recordRequests(page: Page) {
    const urls: string[] = [];
    page.on('request', (request) => urls.push(request.url()));
    return urls;
}

const scripts = (urls: string[]) => urls.filter((url) => /\/assets\/[^/?]+\.js$/.test(new URL(url).pathname));
const chunk = (urls: string[], name: string) => urls.filter((url) => new URL(url).pathname.includes(`/assets/${name}-`));

// String expression: the e2e TypeScript config has no DOM types.
const currentSrc = (page: Page) =>
    page
        .waitForFunction(
            '(() => { const img = document.querySelector(\'[data-test-id="hero-portrait-image"]\'); return img !== null && img.complete && img.currentSrc !== ""; })()',
        )
        .then(() => page.evaluate<string>('document.querySelector(\'[data-test-id="hero-portrait-image"]\').currentSrc'));

// AC-2: the home page requests only its entry script, not the case-study or contact chunks.
test('the home page loads one script and no case-study or contact chunk', async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto('/');
    await expect(page.getByTestId('home-title-heading')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const loaded = scripts(urls);
    expect(loaded, loaded.join('\n')).toHaveLength(1);
    expect(loaded[0]).toMatch(/\/assets\/index-[^/]+\.js$/);
    expect(chunk(urls, 'CaseStudyPage')).toEqual([]);
    expect(chunk(urls, 'contact')).toEqual([]);
});

// AC-3: the contact chunk is requested only once Contact nears the viewport.
test('the contact form chunk loads after scrolling to Contact', async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto('/');
    await expect(page.getByTestId('home-title-heading')).toBeVisible();
    expect(chunk(urls, 'contact')).toEqual([]);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('contact-form-region')).toBeVisible();
    expect(chunk(urls, 'contact').length).toBeGreaterThan(0);
});

// AC-3: a deep link to Contact shows the form.
test('a deep link to #contact shows the contact form', async ({ page }) => {
    await page.goto('/#contact');
    await expect(page.getByTestId('contact-form-region')).toBeVisible();
});

// AC-4: home to a case study and on to the next one, client-side.
test('a work row opens its case study and the next link moves on', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('work-case-study-link').first().click();
    await expect(page).toHaveURL(/\/work\/[^/]+$/);
    const title = page.locator('h1#case-study-title');
    await expect(title).toBeVisible();
    const firstTitle = await title.innerText();
    const firstUrl = page.url();
    await page.getByTestId('case-study-next-link').click();
    await expect(page).not.toHaveURL(firstUrl);
    await expect(page).toHaveURL(/\/work\/[^/]+$/);
    await expect(title).not.toHaveText(firstTitle);
});

// FR-2: in-app navigation keeps the home page on screen until the case-study chunk arrives, with no empty page in between.
test('the home page stays on screen while the case-study chunk loads', async ({ page }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route(/\/assets\/CaseStudyPage-[^/]+\.js$/, async (route) => {
        await held;
        await route.continue();
    });
    await page.goto('/');
    const requested = page.waitForRequest(/\/assets\/CaseStudyPage-/);
    await page.getByTestId('work-case-study-link').first().click();
    await requested;
    // String expression: samples the page every 25 ms for 600 ms while the chunk is held back.
    const homeStayed = await page.evaluate<boolean>(
        'new Promise((resolve) => { let stayed = true; const timer = setInterval(() => { if (!document.querySelector(\'[data-test-id="home-title-heading"]\')) stayed = false; }, 25); setTimeout(() => { clearInterval(timer); resolve(stayed); }, 600); })',
    );
    expect(homeStayed).toBe(true);
    release();
    await expect(page.locator('h1#case-study-title')).toBeVisible();
    await expect(page.getByTestId('home-title-heading')).toHaveCount(0);
});

// AC-4: a deep link to a case study fetches its chunk and renders the title.
test('a deep link to a case study requests the CaseStudyPage chunk', async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto('/work/scheduling-platform');
    await expect(page.locator('h1#case-study-title')).toBeVisible();
    expect(chunk(urls, 'CaseStudyPage').length).toBeGreaterThan(0);
});

// FR-6: a case-study chunk that fails to load (a deploy replaced it while the tab was open) shows the error page inside the layout, not a blank screen.
test('a case-study chunk that fails to load shows the error page', async ({ page }) => {
    await page.route(/\/assets\/CaseStudyPage-[^/]+\.js$/, (route) => route.abort('failed'));
    await page.goto('/work/scheduling-platform');
    await expect(page.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByTestId('route-error-home-link')).toBeVisible();
    await expect(page.getByTestId('header-home-link')).toBeVisible();
});

// AC-5: a 2x phone picks the 160w portrait.
test.describe('portrait on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

    test('loads the 160w file', async ({ page }) => {
        await page.goto('/');
        expect(await currentSrc(page)).toMatch(/portrait-160-/);
    });
});

// AC-5: a 2x laptop picks the 288w portrait for its 144px circle.
test.describe('portrait on a laptop', () => {
    test.use({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });

    test('loads the 288w file', async ({ page }) => {
        await page.goto('/');
        expect(await currentSrc(page)).toMatch(/portrait-288-/);
    });
});

// AC-6: every built page preloads exactly the two latin variable fonts, with crossorigin.
for (const path of ['/', '/work/scheduling-platform/']) {
    test(`${path} carries two font preload links`, async ({ request }) => {
        const html = await (await request.get(path)).text();
        const links = html.match(/<link\b[^>]*\brel="preload"[^>]*>/g)?.filter((tag) => /\bas="font"/.test(tag)) ?? [];
        expect(links).toHaveLength(2);
        for (const tag of links) {
            expect(tag).toMatch(/\bcrossorigin\b/);
            expect(tag).toMatch(/href="[^"]+\.woff2"/);
        }
    });
}

// AC-6: the preload and the CSS fetch share one request per font file.
test('each font file is requested once on the home page', async ({ page }) => {
    const counts = new Map<string, number>();
    page.on('request', (request) => {
        if (request.resourceType() === 'font') {
            counts.set(request.url(), (counts.get(request.url()) ?? 0) + 1);
        }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(counts.size).toBeGreaterThanOrEqual(2);
    for (const [url, count] of counts) {
        expect(count, url).toBe(1);
    }
});
