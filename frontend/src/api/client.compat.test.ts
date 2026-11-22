import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASE_URL, rejection, THINGS_URL, UUID, type TestPaths } from '../test/apiClientFixtures';
import { server } from '../test/server';
import { CORRELATION_HEADER, createApiClient, newCorrelationId, withTimeout } from './client';
import { NETWORK_ERROR } from './errors';

// Older Safari has no AbortSignal.any, and plain-http pages have no crypto.randomUUID; the client must work without them.
const restores: (() => void)[] = [];

function remove(target: object, key: string): void {
    const own = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { value: undefined, configurable: true, writable: true });
    restores.push(() => {
        if (own) {
            Object.defineProperty(target, key, own);
        } else {
            Reflect.deleteProperty(target, key);
        }
    });
}

afterEach(() => {
    restores.splice(0).forEach((restore) => {
        restore();
    });
    vi.restoreAllMocks();
});

describe('client without modern browser APIs', () => {
    it('generates a v4 UUID without crypto.randomUUID', async () => {
        remove(globalThis.crypto, 'randomUUID');
        let sent: string | null = null;
        server.use(
            http.get(THINGS_URL, ({ request }) => {
                sent = request.headers.get(CORRELATION_HEADER);
                return HttpResponse.json({ items: [] });
            }),
        );

        await createApiClient<TestPaths>({ baseUrl: BASE_URL }).GET('/api/v1/things');

        expect(newCorrelationId()).toMatch(UUID);
        expect(sent).toMatch(UUID);
    });

    it('still times out without AbortSignal.any', async () => {
        remove(AbortSignal, 'any');
        server.use(
            http.get(THINGS_URL, async () => {
                await delay('infinite');
                return HttpResponse.json({ items: [] });
            }),
        );

        const error = await rejection(createApiClient<TestPaths>({ baseUrl: BASE_URL, timeoutMs: 20 }).GET('/api/v1/things'));

        expect(error.code).toBe(NETWORK_ERROR);
    });

    it('forwards an abort of the original signal in the fallback', () => {
        remove(AbortSignal, 'any');
        const already = new AbortController();
        already.abort();
        const later = new AbortController();

        const fromAborted = withTimeout(already.signal, 60_000);
        const fromLater = withTimeout(later.signal, 60_000);
        later.abort();

        expect(fromAborted.aborted).toBe(true);
        expect(fromLater.aborted).toBe(true);
    });

    it('reports a failure while preparing the request as NETWORK_ERROR', async () => {
        vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
            throw new TypeError('not supported');
        });

        const error = await rejection(createApiClient<TestPaths>({ baseUrl: BASE_URL }).GET('/api/v1/things'));

        expect(error).toMatchObject({ status: 0, code: NETWORK_ERROR });
        expect(error.correlationId).toMatch(UUID);
    });
});
