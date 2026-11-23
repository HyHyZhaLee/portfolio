import createClient, { type Middleware } from 'openapi-fetch';
import { ApiError, NETWORK_ERROR, toApiError, UNEXPECTED_RESPONSE } from './errors';
import type { paths } from './schema';

export const CORRELATION_HEADER = 'X-Correlation-Id';
/** Most calls give up after 15 s; the visit beacon and the contact form use a 75 s client so a cold start on the free tier still succeeds. */
export const DEFAULT_TIMEOUT_MS = 15_000;
export const COLD_START_TIMEOUT_MS = 75_000;

export interface ApiClientOptions {
    baseUrl?: string;
    timeoutMs?: number;
    /** Non-2xx statuses returned as `error` data instead of thrown, such as the health check's 503 (KNOWN-FE-006). */
    tolerateStatus?: readonly number[];
}

/** A random UUID v4. `crypto.randomUUID` exists only in secure contexts, so plain-http LAN access falls back. */
export function newCorrelationId(): string {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(bytes, (byte, index) => {
        const value = index === 6 ? (byte & 0x0f) | 0x40 : index === 8 ? (byte & 0x3f) | 0x80 : byte;
        return value.toString(16).padStart(2, '0');
    }).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** `signal`, also aborted after `timeoutMs`. Safari before 17.4 has no `AbortSignal.any`, so it falls back to a controller. */
export function withTimeout(signal: AbortSignal, timeoutMs: number): AbortSignal {
    if (typeof AbortSignal.any === 'function') {
        return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort(new DOMException('The request timed out.', 'TimeoutError'));
    }, timeoutMs);
    controller.signal.addEventListener('abort', () => {
        clearTimeout(timer);
    });
    if (signal.aborted) {
        controller.abort(signal.reason);
    } else {
        signal.addEventListener('abort', () => {
            controller.abort(signal.reason);
        });
    }
    return controller.signal;
}

const correlationIdOf = (request: Request): string | undefined => request.headers.get(CORRELATION_HEADER) ?? undefined;
const networkError = (correlationId: string | undefined) => new ApiError({ status: 0, code: NETWORK_ERROR, correlationId });

/**
 * Reads a 2xx body while the request's timeout still applies, so a slow or broken body, or one that is not JSON
 * (such as an HTML page from a misrouted request), becomes an `ApiError` rather than a raw DOMException or SyntaxError.
 * The API only answers JSON or an empty body.
 */
async function readJsonBody(response: Response, correlationId: string | undefined): Promise<Response> {
    let text: string;
    try {
        text = await response.text();
    } catch {
        throw networkError(correlationId);
    }
    if (text !== '') {
        try {
            JSON.parse(text);
        } catch {
            throw new ApiError({ status: response.status, code: UNEXPECTED_RESPONSE, correlationId });
        }
    }
    return new Response(text === '' ? null : text, { status: response.status, statusText: response.statusText, headers: response.headers });
}

/**
 * Adds a correlation ID and a timeout to every request and turns every failure into an `ApiError`: a non-2xx response
 * becomes its problem `code`, and a request that gets no usable response becomes `NETWORK_ERROR`. openapi-fetch only
 * passes failures of `fetch` itself to `onError`, so `onRequest` and `onResponse` convert their own failures.
 */
function apiMiddleware(timeoutMs: number, tolerateStatus: readonly number[]): Middleware {
    return {
        onRequest({ request }) {
            try {
                if (!request.headers.has(CORRELATION_HEADER)) {
                    request.headers.set(CORRELATION_HEADER, newCorrelationId());
                }
                return new Request(request, { signal: withTimeout(request.signal, timeoutMs) });
            } catch {
                throw networkError(correlationIdOf(request));
            }
        },
        async onResponse({ request, response }) {
            const correlationId = correlationIdOf(request);
            if (response.ok) {
                return readJsonBody(response, correlationId);
            }
            if (tolerateStatus.includes(response.status)) {
                return undefined;
            }
            throw await toApiError(response, correlationId);
        },
        onError({ request }) {
            return networkError(correlationIdOf(request));
        },
    };
}

/**
 * Creates a typed client. `Paths` defaults to the generated contract; pass a local type only for endpoints outside it,
 * such as the actuator health check.
 */
export function createApiClient<Paths extends object = paths>({
    baseUrl = import.meta.env.VITE_API_URL ?? '',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    tolerateStatus = [],
}: ApiClientOptions = {}) {
    const client = createClient<Paths>({
        baseUrl,
        // Late-bound so test doubles that patch globalThis.fetch after this module loads still apply (KNOWN-FE-005).
        fetch: (request) => globalThis.fetch(request),
    });
    client.use(apiMiddleware(timeoutMs, tolerateStatus));
    return client;
}

export const apiClient = createApiClient();
