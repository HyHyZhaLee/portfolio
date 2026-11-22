import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/routes';

function createTestQueryClient(): QueryClient {
    return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

/** Renders a component inside a fresh query client and a memory router positioned at `route`. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
    const queryClient = createTestQueryClient();
    return {
        queryClient,
        ...render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </QueryClientProvider>,
        ),
    };
}

/** Renders the application's real route table at `path`. */
export function renderRoute(path: string) {
    const queryClient = createTestQueryClient();
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    return {
        router,
        queryClient,
        ...render(
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>,
        ),
    };
}
