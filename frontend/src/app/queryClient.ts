import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/errors';

const MAX_QUERY_RETRIES = 2;

/** Queries retry network and server failures a couple of times, but never a 4xx: repeating it cannot help. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && error.isClientError) {
        return false;
    }
    return failureCount < MAX_QUERY_RETRIES;
}

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: shouldRetryQuery, refetchOnWindowFocus: false, staleTime: 60_000 },
            // Creating requests (a visit, a contact message) must never be sent twice by the library.
            mutations: { retry: false },
        },
    });
}
