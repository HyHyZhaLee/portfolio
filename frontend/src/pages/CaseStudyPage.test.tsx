import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { caseStudies } from '../content/caseStudies';
import { caseStudyPath, caseStudySlugs, type CaseStudySlug } from '../content/caseStudies/slugs';
import type { CaseStudy } from '../content/caseStudies/types';
import { diagrams } from '../content/diagrams';
import { featuredOrder } from '../content/featuredWork';
import { renderRoute, renderWithProviders } from '../test/renderWithProviders';
import { CaseStudyArticle } from './CaseStudyArticle';

const staticHeadings = ['At a glance', 'Context', 'The problem', 'My role and scope', 'What I built', 'Outcome', 'Tech used'];

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
        const optional = [study.deepDive && `Deep dive: ${study.deepDive.topic}`, study.learned && 'What I learned'].filter((heading) => heading !== undefined);
        for (const heading of [...staticHeadings, ...optional]) {
            expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
        }
        expect(document.title).toBe(`${study.title} | Will Ly`);
        expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', study.metaDescription);
        expect(screen.queryAllByTestId(TestIds.caseStudy.glanceLink).map((link) => link.getAttribute('href'))).toEqual(study.links.map((link) => link.href));
    });

    it('skips the deep-dive and lessons sections when a study has none', () => {
        const rest: CaseStudy = { ...caseStudies[firstSlug], deepDive: undefined, learned: undefined };
        renderWithProviders(<CaseStudyArticle study={rest} />);

        expect(screen.getByRole('heading', { level: 1, name: rest.title })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Outcome' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { level: 2, name: /^Deep dive/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { level: 2, name: 'What I learned' })).not.toBeInTheDocument();
    });

    it('renders the architecture figure for a study with a diagram (PF-022)', () => {
        renderRoute(caseStudyPath('ai-assessment-integration'));

        expect(screen.getByTestId(TestIds.caseStudy.diagram)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Frontera integration architecture' })).toBeInTheDocument();
    });

    it('renders no architecture figure for a study without a diagram (PF-022 FR-9)', () => {
        // Every published study has a diagram now, so a stand-in slug with no diagram file proves the article still renders without one.
        const plain: CaseStudy = { ...caseStudies[firstSlug], slug: 'study-without-diagram' as CaseStudySlug };
        expect(diagrams[plain.slug]).toBeUndefined();
        renderWithProviders(<CaseStudyArticle study={plain} />);

        expect(screen.getByRole('heading', { level: 1, name: plain.title })).toBeInTheDocument();
        expect(screen.queryByTestId(TestIds.caseStudy.diagram)).not.toBeInTheDocument();
    });

    it('starts the next case study with no diagram step pinned (PF-022)', async () => {
        const user = userEvent.setup();
        const { router } = renderRoute(caseStudyPath('this-site'));
        const third = screen.getAllByTestId(TestIds.caseStudy.diagramStep)[2];
        if (!third) throw new Error('This Portfolio needs at least three steps');
        await user.click(third);
        expect(third).toHaveAttribute('aria-pressed', 'true');

        await user.click(screen.getByTestId(TestIds.caseStudy.nextLink));

        expect(router.state.location.pathname).toBe(caseStudyPath('smart-pole'));
        expect(screen.getByRole('img', { name: 'Smart Pole system layers' })).toBeInTheDocument();
        for (const step of screen.getAllByTestId(TestIds.caseStudy.diagramStep)) expect(step).toHaveAttribute('aria-pressed', 'false');
        for (const node of screen.getAllByTestId(TestIds.caseStudy.diagramNode)) expect(node).not.toHaveAttribute('data-dim');
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
