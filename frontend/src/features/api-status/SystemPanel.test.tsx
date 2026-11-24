import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import { renderWithProviders } from '../../test/renderWithProviders';
import { exhaustHealthRetries } from '../../test/healthRetries';
import { server } from '../../test/server';
import { useTrackPageView } from '../visits';
import { ApiStatusDot, SystemPanel, useApiStatus } from '.';

const COUNTED = 'Your visit was counted anonymously.';

function renderPanelAndDot() {
    return renderWithProviders(
        <>
            <SystemPanel />
            <ApiStatusDot />
        </>,
    );
}

/** Mirrors `RootLayout`: the beacon waits for the panel's health check (PF-023 D4). */
function TrackView() {
    useTrackPageView(useApiStatus().api === 'online');
    return null;
}

function renderPanelWithBeacon() {
    return renderWithProviders(
        <>
            <TrackView />
            <SystemPanel />
        </>,
    );
}

describe('SystemPanel and ApiStatusDot', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.useRealTimers();
    });

    it('shows online and connected, and the footer dot says API online, for a healthy backend', async () => {
        renderPanelAndDot();

        expect(screen.getByTestId(TestIds.apiStatus.panel)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.apiState)).toHaveTextContent('Online'));
        expect(screen.getByTestId(TestIds.apiStatus.databaseState)).toHaveTextContent('Connected');
        expect(screen.getByTestId(TestIds.apiStatus.footerState)).toHaveTextContent('API online');
        expect(screen.getByTestId(TestIds.apiStatus.howBuiltLink)).toHaveAttribute('href', '/work/this-site');
    });

    it('shows unreachable and unknown, and the footer dot says API unreachable, when the API cannot be reached', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        server.use(http.get('*/actuator/health', () => HttpResponse.error()));

        renderPanelAndDot();
        await exhaustHealthRetries();

        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.apiState)).toHaveTextContent('Unreachable'));
        expect(screen.getByTestId(TestIds.apiStatus.databaseState)).toHaveTextContent('Unknown');
        expect(screen.getByTestId(TestIds.apiStatus.footerState)).toHaveTextContent('API unreachable');
    });

    it('says the visit was counted once the production beacon is recorded', async () => {
        vi.stubEnv('PROD', true);
        server.use(http.post('*/api/v1/visits', () => new HttpResponse(null, { status: 202 })));

        renderPanelWithBeacon();

        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.panel)).toHaveTextContent(COUNTED));
        expect(screen.getByTestId(TestIds.apiStatus.apiState)).toHaveTextContent('Online');
    });

    it('never says the visit was counted when the beacon is rate-limited', async () => {
        vi.stubEnv('PROD', true);
        let posts = 0;
        server.use(
            http.post('*/api/v1/visits', () => {
                posts += 1;
                return HttpResponse.json(
                    { code: 'RATE_LIMITED', status: 429 },
                    { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': '30' } },
                );
            }),
        );

        const { queryClient } = renderPanelWithBeacon();

        await waitFor(() => expect(posts).toBe(1));
        await waitFor(() => expect(queryClient.isMutating()).toBe(0));
        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.apiState)).toHaveTextContent('Online'));
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50)); // lets the settled mutation reach the panel
        });
        const panel = screen.getByTestId(TestIds.apiStatus.panel);
        expect(panel).toHaveTextContent('The API is online and answering.');
        expect(panel).not.toHaveTextContent(COUNTED);
    });
});
