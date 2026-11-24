import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { advanceTimersInSteps, exhaustHealthRetries } from '../../test/healthRetries';
import { server } from '../../test/server';
import { HEALTH_RECHECK_MS, HEALTH_RECHECK_WINDOW_MS, HEALTH_RETRY_DELAYS_MS } from './queries';
import { SLOW_AFTER_MS, useApiStatus } from './useApiStatus';

function createWrapper(queryClient = new QueryClient()) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('useApiStatus', () => {
    afterEach(() => {
        // Unmount first: resetting focus with a hook still mounted would start a re-check that leaks into the next test.
        cleanup();
        focusManager.setFocused(undefined);
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('maps a healthy 200 to online and connected', async () => {
        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });

        expect(result.current).toEqual({ api: 'checking', database: 'waiting' });
        await waitFor(() => expect(result.current).toEqual({ api: 'online', database: 'connected' }));
    });

    it('maps a 503 with a health body to online and unavailable', async () => {
        server.use(http.get('*/actuator/health', () => HttpResponse.json({ status: 'DOWN', components: { db: { status: 'DOWN' } } }, { status: 503 })));

        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current).toEqual({ api: 'online', database: 'unavailable' }));
    });

    it('retries a failed check after 3 s and 10 s, then maps it to unreachable and unknown', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => {
                calls += 1;
                return HttpResponse.error();
            }),
        );

        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });
        await exhaustHealthRetries();

        await waitFor(() => expect(result.current).toEqual({ api: 'unreachable', database: 'unknown' }));
        expect(calls).toBe(3);
    });

    it('ends online when the retry after a failed first attempt answers', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => {
                calls += 1;
                return calls === 1 ? HttpResponse.error() : HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } });
            }),
        );

        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });
        await advanceTimersInSteps(HEALTH_RETRY_DELAYS_MS[0] + 1000);

        await waitFor(() => expect(result.current).toEqual({ api: 'online', database: 'connected' }));
        expect(calls).toBe(2);
    });

    it('turns online when a later re-check answers after the API was unreachable', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let up = false;
        server.use(
            http.get('*/actuator/health', () => (up ? HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } }) : HttpResponse.error())),
        );
        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });
        await exhaustHealthRetries();
        await waitFor(() => expect(result.current.api).toBe('unreachable'));

        up = true;
        await advanceTimersInSteps(HEALTH_RECHECK_MS + 1000, 1000);

        await waitFor(() => expect(result.current).toEqual({ api: 'online', database: 'connected' }));
    });

    it('re-checks every 60 s while the tab is visible, but not in a hidden tab or after 15 minutes', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => {
                calls += 1;
                return HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } });
            }),
        );
        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.api).toBe('online'));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(HEALTH_RECHECK_MS + 100);
        });
        await waitFor(() => expect(calls).toBe(2));

        focusManager.setFocused(false);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(HEALTH_RECHECK_MS + 100);
        });
        expect(calls).toBe(2);

        // Past the 15-minute window, a return to the tab still re-checks once, and then the re-checks stop.
        vi.spyOn(performance, 'now').mockReturnValue(HEALTH_RECHECK_WINDOW_MS + 1);
        focusManager.setFocused(true);
        await waitFor(() => expect(calls).toBe(3));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2 * HEALTH_RECHECK_MS + 100);
        });
        expect(calls).toBe(3);
    });

    it('moves from checking to waking after 3 s, then to online when the answer arrives', async () => {
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
        );

        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });
        expect(result.current).toEqual({ api: 'checking', database: 'waiting' });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(SLOW_AFTER_MS + 100);
        });
        expect(result.current).toEqual({ api: 'waking', database: 'waiting' });

        release();
        await waitFor(() => expect(result.current).toEqual({ api: 'online', database: 'connected' }));
    });

    it('sends exactly one request for two consumers under one query client', async () => {
        let calls = 0;
        server.use(
            http.get('*/actuator/health', () => {
                calls += 1;
                return HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } });
            }),
        );
        const wrapper = createWrapper();

        const first = renderHook(() => useApiStatus(), { wrapper });
        const second = renderHook(() => useApiStatus(), { wrapper });

        await waitFor(() => expect(first.result.current.api).toBe('online'));
        await waitFor(() => expect(second.result.current.api).toBe('online'));
        expect(calls).toBe(1);
    });
});
