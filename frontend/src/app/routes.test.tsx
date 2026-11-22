import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
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

        render(<RouterProvider router={router} />);

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
