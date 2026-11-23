import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { caseStudyPath } from '../content/caseStudies/slugs';
import { profile } from '../content/profile';
import { NotFoundPage } from '../pages/NotFoundPage';
import { renderRoute, renderWithProviders } from '../test/renderWithProviders';
import { buildRoutes } from './routes';

function Broken(): never {
    throw new Error('render failed');
}

describe('routes', () => {
    it('renders the home page at / without calling the API', () => {
        renderRoute('/');

        expect(screen.getByTestId(TestIds.home.heading)).toHaveTextContent(profile.name);
        expect(screen.getByTestId(TestIds.app.skipLink)).toHaveAttribute('href', '#main-content');
    });

    it('renders the header, the hero proof links, the CV links, and the home title', () => {
        renderRoute('/');

        expect(screen.getByTestId(TestIds.header.homeLink)).toBeInTheDocument();
        const proofLinks = screen.getAllByTestId(TestIds.hero.proofLink);
        expect(proofLinks.map((link) => link.getAttribute('href'))).toEqual(profile.proofPoints.map((point) => caseStudyPath(point.slug)));
        expect(proofLinks).toHaveLength(3);
        expect(screen.getByTestId(TestIds.header.cvLink)).toHaveAttribute('href', '/cv.pdf');
        expect(screen.getByTestId(TestIds.hero.cvLink)).toHaveAttribute('href', '/cv.pdf');
        expect(document.title).toBe('Will Ly - Full-stack Software Engineer');
    });

    it('renders the 404 page for an unknown path and links back home', async () => {
        const { router } = renderRoute('/no-such-page');

        expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
        await userEvent.click(screen.getByTestId(TestIds.notFound.homeLink));

        expect(router.state.location.pathname).toBe('/');
        expect(screen.getByTestId(TestIds.home.heading)).toBeInTheDocument();
    });

    it('keeps the layout and shows the error page when a page throws', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined); // React and the router report the caught error
        const router = createMemoryRouter(buildRoutes([{ index: true, element: <Broken /> }]), { initialEntries: ['/'] });

        render(
            <QueryClientProvider client={new QueryClient()}>
                <RouterProvider router={router} />
            </QueryClientProvider>,
        );

        expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
        expect(screen.getByTestId(TestIds.app.skipLink)).toBeInTheDocument();
        expect(screen.getByTestId(TestIds.routeError.homeLink)).toHaveAttribute('href', '/');
        expect(screen.queryByText('render failed')).not.toBeInTheDocument();
        vi.restoreAllMocks();
    });
});

describe('NotFoundPage', () => {
    it('names the missing path', () => {
        renderWithProviders(<NotFoundPage />, { route: '/missing' });

        expect(screen.getByText('The page /missing does not exist.')).toBeInTheDocument();
    });
});
