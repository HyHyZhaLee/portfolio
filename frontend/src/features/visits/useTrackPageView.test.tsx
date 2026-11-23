import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../test/server';
import { setOptOut } from './tracking';
import { useTrackPageView } from './useTrackPageView';

interface VisitBody {
    path: string;
    referrer?: string;
    ref?: string;
}

/** Stands in for `RootLayout`: the hook lives above the routes, so it survives navigation. */
function Layout() {
    useTrackPageView();
    return <Outlet />;
}

let bodies: VisitBody[];

function renderAt(path: string) {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: <Layout />,
                children: [
                    { index: true, element: <p>home</p> },
                    { path: 'work/:slug', element: <p>case study</p> },
                ],
            },
        ],
        { initialEntries: [path] },
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const view = render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
    return { router, ...view };
}

async function navigate(router: ReturnType<typeof renderAt>['router'], to: string) {
    await act(async () => {
        await router.navigate(to);
    });
}

/** Gives a request the effect may have started time to reach the MSW handler, so "no post" means none was sent. */
async function settle() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
}

function setOwn(target: object, key: string, value: unknown) {
    Object.defineProperty(target, key, { value, configurable: true });
}

describe('useTrackPageView', () => {
    beforeEach(() => {
        bodies = [];
        vi.stubEnv('PROD', true);
        server.use(
            http.post('*/api/v1/visits', async ({ request }) => {
                bodies.push((await request.json()) as VisitBody);
                return new HttpResponse(null, { status: 202 });
            }),
        );
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        // The opt-out also lives in memory for the page load, which outlasts a single test.
        setOptOut(false);
        localStorage.clear();
        sessionStorage.clear();
        Reflect.deleteProperty(navigator, 'globalPrivacyControl');
        Reflect.deleteProperty(document, 'referrer');
    });

    it('posts one view on load and one per route change, and none for an anchor jump', async () => {
        const { router } = renderAt('/');

        await waitFor(() => expect(bodies).toEqual([{ path: '/' }]));

        await navigate(router, '/work/scheduling-platform');
        await waitFor(() => expect(bodies).toHaveLength(2));
        expect(bodies[1]).toEqual({ path: '/work/scheduling-platform' });

        await navigate(router, '/work/scheduling-platform#deep-dive');
        expect(router.state.location.hash).toBe('#deep-dive');
        await settle();
        expect(bodies).toHaveLength(2);
    });

    it('sends the ref tag on every view and removes it from the address', async () => {
        const { router } = renderAt('/?ref=company-a');

        await waitFor(() => expect(router.state.location.search).toBe(''));
        await waitFor(() => expect(bodies).toHaveLength(1));
        expect(bodies[0]).toEqual({ path: '/', ref: 'company-a' });

        await navigate(router, '/work/x');
        await waitFor(() => expect(bodies).toHaveLength(2));
        expect(bodies[1]).toEqual({ path: '/work/x', ref: 'company-a' });
    });

    it('sends the referrer as its origin only', async () => {
        setOwn(document, 'referrer', 'https://www.linkedin.com/feed/?trk=abc');

        renderAt('/');

        await waitFor(() => expect(bodies).toHaveLength(1));
        expect(bodies[0]?.referrer).toBe('https://www.linkedin.com');
    });

    it('sends nothing in a development build', async () => {
        vi.stubEnv('PROD', false);

        renderAt('/');

        await settle();
        expect(bodies).toHaveLength(0);
    });

    it('stops after ?notrack=1, even on later routes, and resumes after ?notrack=0', async () => {
        const first = renderAt('/?notrack=1');

        await waitFor(() => expect(first.router.state.location.search).toBe(''));
        await settle();
        expect(bodies).toHaveLength(0);
        expect(localStorage.getItem('notrack')).toBe('1');

        await navigate(first.router, '/work/x');
        await settle();
        expect(bodies).toHaveLength(0);
        first.unmount();

        const second = renderAt('/?notrack=0');

        await waitFor(() => expect(bodies).toEqual([{ path: '/' }]));
        expect(localStorage.getItem('notrack')).toBeNull();
        await waitFor(() => expect(second.router.state.location.search).toBe(''));
    });

    it('honors ?notrack=1 for the rest of the page load when storage is blocked', async () => {
        const blocked = () => {
            throw new DOMException('Storage is blocked', 'SecurityError');
        };
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

        const { router } = renderAt('/?notrack=1');

        await waitFor(() => expect(router.state.location.search).toBe(''));
        await settle();
        expect(bodies).toHaveLength(0);

        await navigate(router, '/work/x');
        await settle();
        expect(bodies).toHaveLength(0);
    });

    it('sends nothing under Global Privacy Control', async () => {
        setOwn(navigator, 'globalPrivacyControl', true);

        renderAt('/');

        await settle();
        expect(bodies).toHaveLength(0);
    });
});
