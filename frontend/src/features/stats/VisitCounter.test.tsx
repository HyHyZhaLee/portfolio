import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import { renderWithProviders } from '../../test/renderWithProviders';
import { exhaustHealthRetries } from '../../test/healthRetries';
import { server } from '../../test/server';
import { ApiStatusDot } from '../api-status';
import { useRecordVisit } from '../visits/queries';
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
    afterEach(() => {
        vi.useRealTimers();
    });

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
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => HttpResponse.error()),
            http.get('*/api/v1/stats/summary', () => {
                calls += 1;
                return HttpResponse.json({ totalViews: 1, uniqueVisitors: 1, since: SINCE });
            }),
        );

        renderFooterSlot();
        await exhaustHealthRetries();

        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.footerState)).toHaveTextContent('API unreachable'));
        await settle();
        expect(calls).toBe(0);
        expect(screen.getByTestId(TestIds.stats.counterText).textContent).toBe('');
    });

    it('asks again after a recorded view, so the counter includes it', async () => {
        let views = 4;
        server.use(
            http.get('*/api/v1/stats/summary', () => HttpResponse.json({ totalViews: views, uniqueVisitors: 2, since: SINCE })),
            http.post('*/api/v1/visits', () => {
                views += 1;
                return new HttpResponse(null, { status: 202 });
            }),
        );
        renderWithProviders(<CounterWithBeacon />);
        await waitFor(() => expect(screen.getByTestId(TestIds.stats.counterText)).toHaveTextContent(/^4 visits from 2 visitors$/));

        fireEvent.click(screen.getByRole('button', { name: 'record a view' }));

        await waitFor(() => expect(screen.getByTestId(TestIds.stats.counterText)).toHaveTextContent(/^5 visits from 2 visitors$/));
    });
});

/** The counter next to a stand-in for the beacon, which records one view when asked (PF-022 D5). */
function CounterWithBeacon() {
    const { mutate } = useRecordVisit();
    return (
        <>
            <VisitCounter />
            <button
                type='button'
                onClick={() => {
                    mutate({ path: '/' });
                }}
            >
                record a view
            </button>
        </>
    );
}
