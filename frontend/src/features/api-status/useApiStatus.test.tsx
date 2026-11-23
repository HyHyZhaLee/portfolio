import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../test/server';
import { SLOW_AFTER_MS, useApiStatus } from './useApiStatus';

function createWrapper(queryClient = new QueryClient()) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('useApiStatus', () => {
    afterEach(() => {
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

    it('maps a network error to unreachable and unknown', async () => {
        server.use(http.get('*/actuator/health', () => HttpResponse.error()));

        const { result } = renderHook(() => useApiStatus(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current).toEqual({ api: 'unreachable', database: 'unknown' }));
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
