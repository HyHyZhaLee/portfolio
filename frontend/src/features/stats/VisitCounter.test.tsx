import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';
import { ApiStatusDot } from '../api-status';
import { VisitCounter } from './VisitCounter';

const SINCE = '2026-11-23T09:30:00Z';

function renderFooterSlot() {
    return renderWithProviders(
        <>
            <ApiStatusDot />
            <VisitCounter />
        </>,
    );
}

function answerStats(totalViews: number, uniqueVisitors: number) {
    server.use(http.get('*/api/v1/stats/summary', () => HttpResponse.json({ totalViews, uniqueVisitors, since: SINCE })));
}

/** Gives the query time to settle after its response, so "still empty" is not read before the component re-renders. */
async function settle() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
}

describe('VisitCounter', () => {
    it('shows the formatted totals once the API is online and stats answer', async () => {
        answerStats(1284, 312);

        renderFooterSlot();

        await waitFor(() => expect(screen.getByTestId(TestIds.stats.counterText)).toHaveTextContent(/^1,284 visits from 312 visitors$/));
    });

    it('uses the singular for one visit from one visitor', async () => {
        answerStats(1, 1);

        renderFooterSlot();

        await waitFor(() => expect(screen.getByTestId(TestIds.stats.counterText)).toHaveTextContent(/^1 visit from 1 visitor$/));
    });

    it('stays present and empty when the stats request fails', async () => {
        let answered = false;
        server.use(
            http.get('*/api/v1/stats/summary', () => {
                answered = true;
                return HttpResponse.json({ code: 'INTERNAL_ERROR', status: 500 }, { status: 500, headers: { 'Content-Type': 'application/problem+json' } });
            }),
        );

        renderFooterSlot();

        await waitFor(() => expect(answered).toBe(true));
        await settle();
        const counter = screen.getByTestId(TestIds.stats.counterText);
        expect(counter).toBeInTheDocument();
        expect(counter.textContent).toBe('');
    });

    it('never asks for stats while the API is unreachable', async () => {
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => HttpResponse.error()),
            http.get('*/api/v1/stats/summary', () => {
                calls += 1;
                return HttpResponse.json({ totalViews: 1, uniqueVisitors: 1, since: SINCE });
            }),
        );

        renderFooterSlot();

        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.footerState)).toHaveTextContent('API unreachable'));
        await settle();
        expect(calls).toBe(0);
        expect(screen.getByTestId(TestIds.stats.counterText).textContent).toBe('');
    });
});
