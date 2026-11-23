import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import { fallbackRepos } from '../../content/fallbackRepos';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';
import { SLOW_AFTER_MS } from '../api-status';
import { MAX_PROJECTS, ProjectList } from './ProjectList';

const PROJECTS = '*/api/v1/projects';
const fallbackNames = fallbackRepos.map((repo) => repo.name);

function liveProject(index: number) {
    return {
        name: `synthetic-repo-${index}`,
        description: index === 0 ? 'A synthetic description' : null,
        url: `https://github.com/example/synthetic-repo-${index}`,
        language: index === 0 ? 'TypeScript' : null,
        stars: index === 0 ? 1200 : 0,
        topics: [],
        updatedAt: '2026-11-20T08:00:00Z',
    };
}

function repoNames(): string[] {
    return screen.getAllByTestId(TestIds.projects.repoLink).map((link) => link.textContent ?? '');
}

function statusText(): string {
    return screen.getByTestId(TestIds.projects.statusText).textContent ?? '';
}

afterEach(() => {
    vi.useRealTimers();
});

describe('ProjectList', () => {
    it('swaps the fallback for the first six live repositories once the API answers', async () => {
        server.use(http.get(PROJECTS, () => HttpResponse.json({ items: Array.from({ length: 8 }, (_, index) => liveProject(index)) })));

        renderWithProviders(<ProjectList />);
        expect(repoNames()).toEqual(fallbackNames);

        await waitFor(() => expect(statusText()).toBe('Live from the GitHub API, refreshed hourly.'));
        expect(repoNames()).toEqual(Array.from({ length: MAX_PROJECTS }, (_, index) => `synthetic-repo-${index}`));
        expect(screen.getAllByTestId(TestIds.projects.repoLink)[0]).toHaveAttribute('href', 'https://github.com/example/synthetic-repo-0');
        expect(screen.getByText('1,200 stars')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('keeps the fallback and never asks for projects while the API is unreachable', async () => {
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => HttpResponse.error()),
            http.get(PROJECTS, () => {
                calls += 1;
                return HttpResponse.json({ items: [liveProject(0)] });
            }),
        );

        renderWithProviders(<ProjectList />);

        await waitFor(() => expect(statusText()).toBe('Live data is unavailable right now, so this is a saved list.'));
        expect(repoNames()).toEqual(fallbackNames);
        expect(calls).toBe(0);
    });

    it('keeps the fallback after a problem response', async () => {
        server.use(
            http.get(PROJECTS, () =>
                HttpResponse.json({ code: 'INTERNAL_ERROR', status: 500 }, { status: 500, headers: { 'Content-Type': 'application/problem+json' } }),
            ),
        );

        renderWithProviders(<ProjectList />);

        await waitFor(() => expect(statusText()).toBe('Live data is unavailable right now, so this is a saved list.'));
        expect(repoNames()).toEqual(fallbackNames);
    });

    it('keeps the fallback when the API has no repositories to offer', async () => {
        renderWithProviders(<ProjectList />);

        await waitFor(() => expect(statusText()).toBe('Live data is unavailable right now, so this is a saved list.'));
        expect(repoNames()).toEqual(fallbackNames);
    });

    it('shows the cold-start hint after 3 s of waiting, then the live list', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        server.use(
            http.get('*/actuator/health', async () => {
                await gate;
                return HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } });
            }),
            http.get(PROJECTS, () => HttpResponse.json({ items: [liveProject(0)] })),
        );

        renderWithProviders(<ProjectList />);
        expect(statusText()).toBe('');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(SLOW_AFTER_MS + 100);
        });
        expect(statusText()).toBe('Waking up the free-tier API…');
        expect(repoNames()).toEqual(fallbackNames);

        release();
        await waitFor(() => expect(repoNames()).toEqual(['synthetic-repo-0']));
    });
});
