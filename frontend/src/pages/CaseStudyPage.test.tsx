import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { caseStudies } from '../content/caseStudies';
import { caseStudyPath, caseStudySlugs } from '../content/caseStudies/slugs';
import { featuredOrder } from '../content/featuredWork';
import { renderRoute } from '../test/renderWithProviders';

const staticHeadings = ['At a glance', 'Context', 'The problem', 'My role and scope', 'What I built', 'Outcome', 'What I learned', 'Tech used'];

const firstSlug = featuredOrder[0];
const secondSlug = featuredOrder[1];
const lastSlug = featuredOrder[featuredOrder.length - 1];
if (!firstSlug || !secondSlug || !lastSlug) throw new Error('featured order needs at least two case studies');

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CaseStudyPage', () => {
    it.each(caseStudySlugs)('renders the %s case study with its headings, title, and meta description', (slug) => {
        const study = caseStudies[slug];
        renderRoute(caseStudyPath(slug));

        expect(screen.getByRole('heading', { level: 1, name: study.title })).toBeInTheDocument();
        for (const heading of [...staticHeadings, `Deep dive: ${study.deepDive.topic}`]) {
            expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
        }
        expect(document.title).toBe(`${study.title} | Will Ly`);
        expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', study.metaDescription);
        expect(screen.getAllByTestId(TestIds.caseStudy.glanceLink).map((link) => link.getAttribute('href'))).toEqual(study.links.map((link) => link.href));
    });

    it('renders the 404 page for an unknown case study', () => {
        renderRoute('/work/no-such-study');

        expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
        expect(document.title).toBe('Page not found | Will Ly');
    });

    it.each([
        ['the first', firstSlug, secondSlug],
        ['the last (wrapping to the first)', lastSlug, firstSlug],
    ])('links the next case study from %s one in Featured work order', (_label, from, to) => {
        renderRoute(caseStudyPath(from));

        const next = screen.getByTestId(TestIds.caseStudy.nextLink);
        expect(next).toHaveAttribute('href', caseStudyPath(to));
        expect(next).toHaveTextContent(caseStudies[to].title);
    });

    it("goes to the home page's work section from the header Work link", async () => {
        const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
        const { router } = renderRoute(caseStudyPath(firstSlug));

        const workLink = screen.getAllByTestId(TestIds.header.navLink).find((link) => link.textContent === 'Work');
        if (!workLink) throw new Error('no Work nav link in the header');
        await userEvent.click(workLink);

        expect(router.state.location.pathname).toBe('/');
        expect(router.state.location.hash).toBe('#work');
        expect(await screen.findByRole('heading', { level: 2, name: 'Featured work' })).toBeInTheDocument();
        expect(scrollIntoView).toHaveBeenCalled();
    });

    it('goes back to the work section of the home page from the back link', async () => {
        const { router } = renderRoute(caseStudyPath(firstSlug));

        await userEvent.click(screen.getByTestId(TestIds.caseStudy.backLink));

        expect(router.state.location.pathname).toBe('/');
        expect(router.state.location.hash).toBe('#work');
    });
});
