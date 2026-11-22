import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../test/server';
import { CORRELATION_HEADER, createApiClient, type ApiClientOptions } from './client';
import { ApiError, NETWORK_ERROR, UNEXPECTED_RESPONSE } from './errors';
import { BASE_URL, rejection, THINGS_URL, UUID, type TestPaths } from '../test/apiClientFixtures';

const client = (options: ApiClientOptions = {}) => createApiClient<TestPaths>({ baseUrl: BASE_URL, ...options });

describe('createApiClient', () => {
    it('returns data and sends a correlation ID', async () => {
        let sentCorrelationId: string | null = null;
        server.use(
            http.get(THINGS_URL, ({ request }) => {
                sentCorrelationId = request.headers.get(CORRELATION_HEADER);
                return HttpResponse.json({ items: ['a'] });
            }),
        );

        const { data } = await client().GET('/api/v1/things');

        expect(data).toEqual({ items: ['a'] });
        expect(sentCorrelationId).toMatch(UUID);
    });

    it('accepts an empty 2xx body', async () => {
        server.use(http.get(THINGS_URL, () => new HttpResponse(null, { status: 202 })));

        const { data, response } = await client().GET('/api/v1/things');

        expect(response.status).toBe(202);
        expect(data).toBeUndefined();
    });

    it('turns a problem response into an ApiError with its code, field errors, and correlation ID', async () => {
        server.use(
            http.get(THINGS_URL, () =>
                HttpResponse.json(
                    {
                        status: 400,
                        code: 'VALIDATION_FAILED',
                        detail: 'Invalid request',
                        correlationId: 'corr-1',
                        errors: [{ field: 'email', message: 'must be a valid email' }, { field: 42 }],
                    },
                    { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
                ),
            ),
        );

        const error = await rejection(client().GET('/api/v1/things'));

        expect(error).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', detail: 'Invalid request', correlationId: 'corr-1' });
        expect(error.errors).toEqual([{ field: 'email', message: 'must be a valid email' }]);
        expect(error.isClientError).toBe(true);
    });

    it('reports a non-problem error body as UNEXPECTED_RESPONSE with the request correlation ID', async () => {
        server.use(http.get(THINGS_URL, () => new HttpResponse('<html>Bad gateway</html>', { status: 502 })));

        const error = await rejection(client().GET('/api/v1/things'));

        expect(error).toMatchObject({ status: 502, code: UNEXPECTED_RESPONSE, errors: [] });
        expect(error.correlationId).toMatch(UUID);
        expect(error.isClientError).toBe(false);
    });

    it('reports a 2xx body that is not JSON as UNEXPECTED_RESPONSE', async () => {
        server.use(http.get(THINGS_URL, () => HttpResponse.html('<!doctype html><title>SPA</title>')));

        const error = await rejection(client().GET('/api/v1/things'));

        expect(error).toMatchObject({ status: 200, code: UNEXPECTED_RESPONSE });
    });

    it('reports a 2xx body that breaks off as NETWORK_ERROR', async () => {
        // Stubs fetch itself: MSW would read the broken stream before answering and fail the whole request instead.
        const broken = new ReadableStream({
            start(controller) {
                controller.error(new Error('connection reset'));
            },
        });
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(broken, { status: 200, headers: { 'Content-Type': 'application/json' } }));

        const error = await rejection(client().GET('/api/v1/things'));

        expect(error).toMatchObject({ status: 0, code: NETWORK_ERROR });
        vi.restoreAllMocks();
    });

    it('returns a tolerated status as error data instead of throwing', async () => {
        server.use(http.get(THINGS_URL, () => HttpResponse.json({ status: 'DOWN' }, { status: 503 })));

        const { error, response } = await client({ tolerateStatus: [503] }).GET('/api/v1/things');

        expect(response.status).toBe(503);
        expect(error).toEqual({ status: 'DOWN' });
    });

    it('reports a request that gets no response as NETWORK_ERROR', async () => {
        server.use(http.get(THINGS_URL, () => HttpResponse.error()));

        const error = await rejection(client().GET('/api/v1/things'));

        expect(error).toMatchObject({ status: 0, code: NETWORK_ERROR });
        expect(error.correlationId).toMatch(UUID);
    });

    it('gives up after the timeout and reports NETWORK_ERROR', async () => {
        server.use(
            http.get(THINGS_URL, async () => {
                await delay('infinite');
                return HttpResponse.json({ items: [] });
            }),
        );

        const error = await rejection(client({ timeoutMs: 20 }).GET('/api/v1/things'));

        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe(NETWORK_ERROR);
    });
});
